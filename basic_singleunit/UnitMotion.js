function UnitMotionBasicSingle(grid, visualization, unit)
{
	this.grid = grid;
	this.gridAStar = new GridAStar(this.grid);
	this.visualization = visualization;
	this.unit = unit;
	this.longPath = false;
	// a queue of points with waypoint positions
	this.shortPaths = [];
}

UnitMotionBasicSingle.prototype.GetPathGoalNavcell = function() 
{
	let goal = this.unit.GetPathGoal();
	return this.grid.GetCellIdP(goal.x, goal.y);
}

UnitMotionBasicSingle.prototype.HasReachedGoal = function()
{
	let pos = this.unit.pos;
	if (this.GetPathGoalNavcell() == this.grid.GetCellIdP(pos.x, pos.y))
		return true;
	return false;
}

UnitMotionBasicSingle.prototype.OnTurn = function(turn, timePassed)
{
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

		// a copy of the vectors is needed.
		// they are going to be modified later and the visualization data should remain unchanged
		let summaryData = { vectors: [] };
		summaryData["startPoint"] = new Vector2D(this.unit.pos.x, this.unit.pos.y);
		for (let vec of this.shortPaths) {
			summaryData.vectors.push(new Vector2D(vec.x, vec.y));
		}
		
		this.visualization.addSummaryData("shortrange", "vectorOverlay", turn, this.unit.id, summaryData);
	}


	while (timeLeft && this.shortPaths.length != 0) {
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
			this.shortPaths.shift();
		}
	}
}


// Just make vectors from the list of navcells we have in the long path
UnitMotionBasicSingle.prototype.GetShortPaths = function() 
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
