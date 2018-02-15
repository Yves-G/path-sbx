function UnitMotionGroup(grid, visualization, unit)
{
	this.grid = grid;
	this.gridAStar = new GridAStar(this.grid);
	this.visualization = visualization;
	this.unit = unit;
	this.longPath = [];
	// array of vectors starting from shortPathsStartPoint and leading from one waypoint to the next
	this.shortPaths = [];
	this.shortPathStartPoint = new Vector2D();

	this.lastFFWPGoal = false;
	this.lastFFWPTriggerDist = 5;
	this.goalIsInFF = false;
	this.wpD = [];

	this.currentTurn;
}

UnitMotionGroup.prototype.GetPathGoalNavcell = function() 
{
	let goal = this.unit.GetPathGoal();
	return this.grid.GetCellIdP(goal.x, goal.y);
}

UnitMotionGroup.prototype.HasReachedGoal = function()
{
	let pos = this.unit.pos;
	if (this.GetPathGoalNavcell() == this.grid.GetCellIdP(pos.x, pos.y))
		return true;
	return false;
}

UnitMotionGroup.prototype.OnTurn = function(turn, timePassed)
{
	this.currentTurn = turn;
	// It's more convenient to calculate speed in m/s instead of m/msec
	
//	timePassed = 250; // use for debugging
	let timeLeft = timePassed / 1000;

	if (this.unit.GetPathGoal().length() == 0 || this.HasReachedGoal())
		return;

	if (this.shortPaths.length == 0) {
		let start = this.grid.GetCellIdP(this.unit.pos.x, this.unit.pos.y);
		let goal = this.GetPathGoalNavcell();
		let ret = {};
		this.gridAStar.aStar(start, goal, ret);
		this.visualization.addSummaryData("longrange", "gridOverlay", turn, this.unit.id, ret.visualizationSummaryData);
		this.longPath = ret.totalPath;
	}

	if (this.shortPaths.length == 0) {
		if (!this.GetShortPaths())
			return;

		this.AddShortRangeVectorOverlay();
	}

	if (this.shortPaths.length != 0) {
		this.UpdateGroupPos();

		if (!this.goalIsInFF && (!this.lastFFWPGoal || Vector2D.sub(this.lastFFWPGoal, this.unit.GetMovePos()).length() < this.lastFFWPTriggerDist) ) {
			this.BuildFlowField(turn);
		}
	}

	this.MoveUnits(turn, timePassed);
}

UnitMotionGroup.prototype.UpdateGroupPos = function()
{
	if (!this.shortPaths || this.shortPaths.length == 0)
		return;

	// First, calculate the average position of all units in the group.
	const movePosAdvanceDist = 5;
	let units = this.unit.units;
	let avgPos = new Vector2D();
	for (let unit of units) {
		avgPos.add(unit.pos);
	}
	avgPos.x /= units.length;
	avgPos.y /= units.length;

	// Find the point on the path spline which is closest to the average position.
	let currPos = Vector2D.clone(this.shortPathStartPoint);
	let closestDist = -1;
	let closestPoint = new Vector2D();
	let closestPathVecIx = -1;
	let closestPathVecStartPos = new Vector2D();
	let count = 0;

	for (let vec of this.shortPaths) {

		let plDist = pointToLineDistance(avgPos, currPos, Vector2D.add(currPos, vec));
		if (closestDist == -1 || closestDist > plDist.dist) {
			closestDist = plDist.dist;
			closestPoint = plDist.intersectionPoint;
			closestPathVecIx = count;
			closestPathVecStartPos = Vector2D.clone(currPos);
		}
		currPos.add(vec);
		count++;
	}

	// We never move the move position back, so we can delete the vectors we
	// have passed.
	this.shortPaths = this.shortPaths.slice(closestPathVecIx);
	this.shortPathStartPoint = closestPathVecStartPos;
	this.AddShortRangeVectorOverlay(); // update visualization

	this.unit.avgPos = closestPoint;
	this.AddPositionOverlay([this.unit.avgPos, avgPos]);

	// start at the current avgPos
	let movePos = Vector2D.clone(this.unit.avgPos);
	let currDist = 0;

	// The current position is on a vector leading to the next waypoint.
	let nextWp = Vector2D.add(closestPathVecStartPos, this.shortPaths[0]);
	let toWp = Vector2D.sub(nextWp, movePos);

	let i = 0;
	while (currDist < movePosAdvanceDist) {

		if (currDist + toWp.length() > movePosAdvanceDist) {
			let remainingDist = movePosAdvanceDist - currDist;
			toWp.mult(remainingDist / toWp.length());
		}

		movePos.add(toWp);
		currDist += toWp.length();
		let vecX = new Vector2D(1, 0);
		this.unit.orientation = Vector2D.angle(toWp, vecX);

		i++;
		if (i >= this.shortPaths.length)
			break;

		toWp = Vector2D.clone(this.shortPaths[i]);
	}
	this.unit.movePos = movePos;
}

UnitMotionGroup.prototype.MoveUnits = function(turn, timePassed)
{
	// reset timeLeft for unit movement
	timeLeft = timePassed / 1000;
	let group = this.unit;
	let spots = group.GetUnitSpots();

	let moveVisualization = { points: [], vecs: [] };

	for (let i = 0; i < group.units.length; ++i) {

		let unitPos = Vector2D.clone(group.units[i].pos);
		let spotPos = Vector2D.add(group.movePos, spots[i]);
		let unitCellId = this.grid.GetCellIdP(unitPos.x, unitPos.y);
		let currentCellNbr = this.wpD.grid[this.wpD.CellIdFromOtherGrid(unitCellId, this.grid)];
		let unitNeighborCells = this.grid.GetNeighbors(unitCellId);

		// spot vector: vector from the current position of the unit to the designated spot in the formation
		let spV = Vector2D.sub(spotPos, unitPos);

		// Directional vectors: [left, upleft, up, upright, right, downright, down, downleft]. 
		// Their length is: wpD[CurrCell] - wpD[NextCell] if that's a positive value, otherwise
		// the element gets removed from the set.
		let dV = [];
		for (let cell of unitNeighborCells) {

			let vec = Vector2D.clone(cell.vec);
			let cellNbr = this.wpD.grid[this.wpD.CellIdFromOtherGrid(cell.ix, this.grid)];
			let wpDistChange = currentCellNbr - cellNbr;

			if (wpDistChange < 0) {
				continue;
			}

			vec.normalize();
			vec.mult(wpDistChange);
			dV.push(vec);
		}

		// Vectors with distance and direction towards impassable cells icV
		// The input vectors icV are consructed this way for each cell in some range:
		// From unit pos, ray intersect the cell box. Then reduce the length of that vector by unitObstructionSize/2.
		let icV = [];
		// TODO: leaving that out for now to see how well/bad it works without it.

		let moveVec = this.MoveUnit(unitPos, dV, spV, icV);

		if (moveVec.length() > group.units[i].speed * timeLeft) {
			let moveLen = group.units[i].speed * timeLeft;
			moveVec.mult(moveLen/moveVec.length());
			moveVisualization.points.push(Vector2D.clone(group.units[i].pos));
			moveVisualization.vecs.push(Vector2D.clone(moveVec));
			group.units[i].pos.add(moveVec);
			continue;
		}
		else {
			moveVisualization.points.push(Vector2D.clone(group.units[i].pos));
			moveVisualization.vecs.push(Vector2D.clone(moveVec));
			group.units[i].pos.add(moveVec); // TODO: we could move more...
			continue;
		}
	}
	this.AddVectorOverlay(moveVisualization.points, moveVisualization.vecs);
}

UnitMotionGroup.prototype.MoveUnit = function(unitPos, dV, spV, icV)
{
	let rV = new Vector2D();
	let maxDv = new Vector2D()

	for (let vec of dV) {
		rV.add(vec);
		if (maxDv.length() < vec.length()) { maxDv = Vector2D.clone(vec); }
	}
	rV.normalize();

	// Sticking to the spot in the formation is less important than following the
	// path and avoiding obstacles, so reduce the length of that vector before adding it.
	//
	// TODO: Yes... actually it's not always less important. It depends on the situation
	// and we need some logic to detect different situations and act accordingly.
	spV.normalize();
	spV.mult(0.9);

	rV.add(spV);
	rV.normalize();

	let checkV = Vector2D.clone(rV);
	checkV.add(unitPos);

	let fallback = true;
	tst0 = this.grid.GetCellRowColP(unitPos.x, unitPos.y);
	tst1 = this.grid.GetCellRowColP(checkV.x, checkV.y);
	if (tst0.row - tst1.row != 0 && tst0.col - tst1.col != 0) { // diagonal movement
	// Diagonal movement (like from A to C or from D to B) is only allowed if all adjacent cells (A, B, C and D) are passable. 
	//    AD
	//    BC
		let ids = [];
		ids[0] = this.grid.GetCellIdC(tst0.row, tst0.col);
		ids[1] = this.grid.GetCellIdC(tst0.row, tst1.col);
		ids[2] = this.grid.GetCellIdC(tst1.row, tst0.col);
		ids[3] = this.grid.GetCellIdC(tst1.row, tst1.col);
		if (this.grid.IsPassable(ids[0]) && this.grid.IsPassable(ids[1]) &&
		    this.grid.IsPassable(ids[2]) && this.grid.IsPassable(ids[3])) {
			fallback = false;
		}
	} else if (this.grid.IsPassable(this.grid.GetCellIdC(tst1.row, tst1.col))) { // just check destination
		fallback = false;
	}

	// Fall back to just trying to get around obstacle to avoid collisions
	if (fallback) {
		return maxDv;
	}

	return rV;
}

UnitMotionGroup.prototype.BuildFlowField = function(turn)
{
	let group = this.unit;

	// When building a new flowfield, add move vectors until the point where the vector points
	// to is movePosExpandDist away from movePos.
	let movePosExpandDist = 15;
	let corridorWidth = 15;
	let leftX = group.GetAvgPos().x;
	let rightX = group.GetAvgPos().x;
	let bottomZ = group.GetAvgPos().y;
	let topZ = group.GetAvgPos().y;

	// Take all units in the group and calculate a region that contains them all.
	for (let unit of group.units) {
		leftX = Math.min(leftX, unit.pos.x);
		bottomZ = Math.min(bottomZ, unit.pos.y);
		rightX = Math.max(rightX, unit.pos.x);
		topZ = Math.max(topZ, unit.pos.y);
	}

	// The next step is to expand the region size to contain additional vectors until a certain distance from the formation move position is reached.
	let ix = 0;
	let movePosDist = 0;
	let movePos = group.GetMovePos();
	pathGoalPos = Vector2D.clone(this.shortPathStartPoint);
	do
	{
		pathGoalPos.add(this.shortPaths[ix]);
		leftX = Math.min(leftX, pathGoalPos.x);
		rightX = Math.max(rightX, pathGoalPos.x);
		bottomZ = Math.min(bottomZ, pathGoalPos.y);
		topZ = Math.max(topZ, pathGoalPos.y);
		movePosDist = Vector2D.sub(pathGoalPos, movePos).length();
		ix++;
		if (ix == this.shortPaths.length)
			this.goalIsInFF = true;

	} while (movePosDist <= movePosExpandDist && ix < this.shortPaths.length)

	this.lastFFWPGoal = pathGoalPos;

	// There must also be enough room perpendicular to the path spline for the formation to move.
	leftX -= corridorWidth / 2
	rightX +=  corridorWidth / 2
	bottomZ -=  corridorWidth / 2
	topZ += corridorWidth / 2

	let maxCell, minCell;
	minCell = this.grid.GetCellRowColP(leftX, bottomZ);
	maxCell = this.grid.GetCellRowColP(rightX, topZ);

	// goal cell calculation
	let lastVec = this.shortPaths[ix];
	let flowfieldCols = maxCell.col - minCell.col;
	let flowfieldRows = maxCell.row - minCell.row;
	let flowFieldCoordSpace = new CoordSpace(flowfieldCols, flowfieldRows, minCell.col, minCell.row);
	let ffGrid = new Grid(flowFieldCoordSpace);

	let wp = ffGrid.CellIdFromOtherGrid(this.grid.GetCellIdP(pathGoalPos.x, pathGoalPos.y), this.grid);

	this.wpD = new Grid(flowFieldCoordSpace, "Float32"); // waypoint distance
	this.wpD.grid[wp] = 0;

	// copy passability for flowfield grid
	for (let i = 0; i < flowfieldRows; ++i) {
		for (let j = 0; j < flowfieldCols; ++j) {
			let fullGridIx = this.grid.CellIdFromOtherGrid(ffGrid.GetCellIdC(i, j), ffGrid);
			ffGrid.SetCell(j, i, this.grid.grid[fullGridIx]);
		}
	}

	this.WpDistFlowField(ffGrid, wp, this.wpD.grid);

	// Visualization of flowfield step 1:

	let overlayObj = {};
	overlayObj["displayName"] = "Flowfield overlay";
	overlayObj["nodeTypeNames"] = [ "Flowfield boundary", "Impassable"];
	overlayObj["nodes"] = new Map();
	overlayObj["nodeTexts"] = new Map();

	for (let i = minCell.row; i < maxCell.row; ++i) {
		for (let j = minCell.col; j < maxCell.col; ++j) {
			let cell = this.grid.GetCellIdC(i, j);
			let isPassable = ffGrid.IsPassable(ffGrid.CellIdFromOtherGrid(cell, this.grid));
			overlayObj["nodes"].set(cell, isPassable ? 0 : 1);
			if (isPassable) { // don't add the text for impassable cells because it would print "NaN".
				overlayObj["nodeTexts"].set(cell, Math.round(this.wpD.grid[ffGrid.CellIdFromOtherGrid(cell, this.grid)]));
			}
		}
	}

	// Visualize the waypoint
	let wpfullGrid = this.grid.CellIdFromOtherGrid(wp, ffGrid);
	overlayObj["nodeTexts"].set(wpfullGrid, "w");
	overlayObj["nodes"].set(wpfullGrid, 2);

	this.visualization.addSummaryData("flowfield", "gridOverlay", turn, this.unit.id, overlayObj);
}

UnitMotionGroup.prototype.WpDistFlowField = function(grid, start, wpD)
{
	let openNodes = [];
	let closedSet = new Set();
	closedSet.add(start);
	for (let cell of grid.GetNeighbors(start)) { openNodes.push(cell.ix); };

	while (openNodes.length > 0) {

		let current = openNodes.shift();
		closedSet.add(current);

		let neighbors = grid.GetNeighbors(current);
		for (let neighbor of neighbors) {
			if (closedSet.has(neighbor.ix)) {
				if (wpD[current] == 0) {
					wpD[current] = wpD[neighbor.ix] + neighbor.dist;
				} else {
					wpD[current] = Math.min(wpD[current], wpD[neighbor.ix] + neighbor.dist);
				}
			} else {
				if (openNodes.indexOf(neighbor.ix) === -1) {
					openNodes.push(neighbor.ix);
				}
			}
		}
	}
}

UnitMotionGroup.prototype.AddShortRangeVectorOverlay = function()
{
		// a copy of the vectors is needed.
		// they are going to be modified later and the visualization data should remain unchanged
		let summaryData = { vectors: [] };
		summaryData["startPoint"] = new Vector2D(this.shortPathStartPoint.x, this.shortPathStartPoint.y);
		for (let vec of this.shortPaths) {
			summaryData.vectors.push(new Vector2D(vec.x, vec.y));
		}
		
		this.visualization.addSummaryData("shortrange", "vectorSplineOverlay", this.currentTurn, this.unit.id, summaryData);
}

UnitMotionGroup.prototype.AddPositionOverlay = function(positions)
{
		let posCopy = [];
		for (let pos of positions) { posCopy.push(pos); }

		let summaryData = { "points": posCopy };

		this.visualization.addSummaryData("positions", "positionOverlay", this.currentTurn, this.unit.id, summaryData);
}

UnitMotionGroup.prototype.AddVectorOverlay = function(points, vecs)
{
		// a copy of the vectors is needed.
		// they are going to be modified later and the visualization data should remain unchanged
		let summaryData = { "vectors": vecs, "points": points };
		this.visualization.addSummaryData("vector", "vectorOverlay", this.currentTurn, this.unit.id, summaryData);
}



// Just make vectors from the list of navcells we have in the long path
UnitMotionGroup.prototype.GetShortPaths = function() 
{
	let cols = this.grid.cols;
	let rows = this.grid.rows;

	let prevNavCell = -1;
	let sectionStartNavCell = -1;
	let prevDir = 0;
	let ret = false;

	for (let i = this.longPath.length - 1; i >= 0; i--) {

		let currNavCell = this.longPath[i];
		if (prevNavCell == -1) {
			prevNavCell = currNavCell;
			sectionStartNavCell = currNavCell;
			this.shortPathStartPoint = this.grid.GetPositionC(currNavCell);
			continue;
		}

		let x;
		let z;
		// const left = -1, upleft = cols - 1, up = cols, upright = cols + 1;
		// const right = 1, downright = -cols + 1, down = -cols, downleft = -cols - 1;
		let dir = currNavCell - prevNavCell;
		
		if (prevDir == 0) {
			prevDir = dir;
		}

		if (prevDir == dir && i != 0) {
			prevNavCell = currNavCell;
			continue;
		}

		if (prevDir != dir) {
			x = prevNavCell % cols - sectionStartNavCell % cols;
			z = Math.floor(prevNavCell / cols) - Math.floor(sectionStartNavCell / cols);
			sectionStartNavCell = prevNavCell;
			let vec = new Vector2D(x, z);
			this.shortPaths.push(vec);
			ret = true;
		}
		if (i == 0) {
			// for the last one we have to use the current navcell for the calculation instead of the previous navcell
			x = currNavCell % cols - sectionStartNavCell % cols;
			z = Math.floor(currNavCell / cols) - Math.floor(sectionStartNavCell / cols);
			let vec = new Vector2D(x, z);
			this.shortPaths.push(vec);
			ret = true;
		}

		prevNavCell = currNavCell;
		prevDir = dir;
 
	}
	return ret;
}
