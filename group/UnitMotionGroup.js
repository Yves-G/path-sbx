function UnitMotionGroup(grid, visualization, unit)
{
	this.grid = grid;
	this.gridAStar = new GridAStar(this.grid);
	this.visualization = visualization;
	this.unit = unit;
	this.longPath = false;
	// a queue of points with waypoint positions
	this.shortPaths = [];

	// number of path waypoints remaining until a new flowfield needs to be built
	this.flowfieldTriggerCount = 0;

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

	if (!this.longPath && this.shortPaths.length == 0) {
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

	if (this.shortPaths.length == ix)
		this.flowfieldTriggerCount = -1; // -1 indicates the the current flowfield covers the rest of the path
	else
		this.flowfieldTriggerCount = ix - 1;

	leftX -= corridorWidth / 2
	rightX +=  corridorWidth / 2
	bottomZ -=  corridorWidth / 2
	topZ += corridorWidth / 2

	// Visualization
	let overlayObj = {};
	overlayObj["displayName"] = "Flowfield overlay";
	overlayObj["nodeTypeNames"] = [ "Flowfield boundary"];
	overlayObj["nodes"] = new Map();

	// also visualize the remaining short range paths
	this.AddShortRangeVectorOverlay();

	let maxCell, minCell;
	minCell = this.grid.GetCellRowCol(leftX, bottomZ);
	maxCell = this.grid.GetCellRowCol(rightX, topZ);

	for (i = minCell.row; i < maxCell.row; ++i) {
		for (j = minCell.col; j < maxCell.col; ++j) {
			overlayObj["nodes"].set(this.grid.GetCellIdC(i, j), 0);
		}
	}

	this.visualization.addSummaryData("flowfield", "gridOverlay", turn, this.unit.id, overlayObj);
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
	this.longPath = false;
	return ret;
}
