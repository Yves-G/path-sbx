function UnitMotionGroup(grid, visualization, unit)
{
	this.grid = grid;
	this.gridAStar = new GridAStar(this.grid);
	this.visualization = visualization;
	this.unit = unit;
	this.longPath = [];
	// a queue of points with waypoint positions
	this.shortPaths = [];

	// number of path waypoints remaining until a new flowfield needs to be built
	this.flowfieldTriggerCount = 0;
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
		this.flowfieldTriggerCount = 0;
	}

	while (timeLeft) {
		if (this.flowfieldTriggerCount == 0) {
			this.BuildFlowField(turn);
		}
		let pathVec = this.shortPaths[0];
		
		if (pathVec.length() > this.unit.speed * timeLeft) {
			let moveVec = Vector2D.clone(pathVec);
			let moveLen = this.unit.speed * timeLeft;
			moveVec.mult(moveLen/moveVec.length());
			this.unit.pos.add(moveVec);
			pathVec = pathVec.mult((pathVec.length() - moveLen) / pathVec.length())
			return;
		}
		else {
			this.unit.pos.add(pathVec);
			// timeLeft in seconds, speed in meters per second
			timeLeft -= pathVec.length() / this.unit.speed;
			this.MovedPastWaypoint();
		}
	}
}

UnitMotionGroup.prototype.BuildFlowField = function(turn)
{
	// Add direction vectors to the path spline unit maxLength is exceeded.
	// Use that part of the path for one flowfield.
	let maxLength = 30;
	let corridorWidth = 10;
	let currLength = 0;
	let currVec = Vector2D.clone(this.unit.pos);
	let leftX = currVec.x;
	let rightX = currVec.x;
	let bottomZ = currVec.y;
	let topZ = currVec.y;

	let ix = 0;
	do
	{
		currLength += this.shortPaths[ix].length();
		currVec.add(this.shortPaths[ix]);
		leftX = Math.min(leftX, currVec.x);
		rightX = Math.max(rightX, currVec.x);
		bottomZ = Math.min(bottomZ, currVec.y);
		topZ = Math.max(topZ, currVec.y);
		ix++;
	} while (currLength < maxLength && ix < this.shortPaths.length)

	leftX -= corridorWidth / 2
	rightX +=  corridorWidth / 2
	bottomZ -=  corridorWidth / 2
	topZ += corridorWidth / 2

	let maxCell, minCell;
	minCell = this.grid.GetCellRowColP(leftX, bottomZ);
	maxCell = this.grid.GetCellRowColP(rightX, topZ);

	if (this.shortPaths.length == ix)
		this.flowfieldTriggerCount = -1; // -1 indicates the the current flowfield covers the rest of the path
	else
		this.flowfieldTriggerCount = ix - 1;

	// goal cell calculation
	let lastVec = this.shortPaths[ix];
	let flowfieldCols = maxCell.col - minCell.col;
	let flowfieldRows = maxCell.row - minCell.row;
	let flowFieldCoordSpace = new CoordSpace(flowfieldCols, flowfieldRows, minCell.col, minCell.row);
	let ffGrid = new Grid(flowFieldCoordSpace);

	let wp = ffGrid.CellIdFromOtherGrid(this.grid.GetCellIdP(currVec.x, currVec.y), this.grid);

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

	// also visualize the remaining short range paths
	this.AddShortRangeVectorOverlay();

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

UnitMotionGroup.prototype.MovedPastWaypoint = function()
{
	this.flowfieldTriggerCount--;
	this.shortPaths.shift();
	this.AddShortRangeVectorOverlay();
}

UnitMotionGroup.prototype.AddShortRangeVectorOverlay = function()
{
		// a copy of the vectors is needed.
		// they are going to be modified later and the visualization data should remain unchanged
		let summaryData = { vectors: [] };
		summaryData["startPoint"] = new Vector2D(this.unit.pos.x, this.unit.pos.y);
		for (let vec of this.shortPaths) {
			summaryData.vectors.push(new Vector2D(vec.x, vec.y));
		}
		
		this.visualization.addSummaryData("shortrange", "vectorOverlay", this.currentTurn, this.unit.id, summaryData);
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
