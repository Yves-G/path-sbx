function UnitMotionBasicSingle(grid, visualization, unit)
{
	this.grid = grid;
	this.gridAStar = new GridAStar(this.grid);
	this.visualization = visualization;
	this.unit = unit;
	this.pathGoal = new Vector2D();
	this.pathGoalNavcell = 0;
	this.longPath = false;
	// a queue of points with waypoint positions
	this.shortPaths = [];
	this.speed = 1.0; // speed in m/s
}

UnitMotionBasicSingle.prototype.SaveState = function(state)
{
	state.pathGoalX = this.pathGoal.x;
	state.pathGoalY = this.pathGoal.y;
	state.pathGoalNavcell = this.pathGoalNavcell;
//	state.longPath = this.longPath;
//	state.shortPaths = this.shortPaths;
	state.speed = this.speed; // speed in m/s
}

UnitMotionBasicSingle.prototype.LoadState = function(state)
{
	this.pathGoal = new Vector2D(state.pathGoalX, state.pathGoalY);
	this.pathGoalNavcell = state.pathGoalNavcell;
//	this.longPath = state.longPath;
//	this.shortPaths = state.shortPaths;
	this.speed = state.speed; // speed in m/s
}

UnitMotionBasicSingle.prototype.SetPathGoal = function(posX, posZ)
{
	this.pathGoal.set(posX, posZ);
	this.pathGoalNavcell = this.grid.GetCellId(posX, posZ);
}

UnitMotionBasicSingle.prototype.GetPathGoal = function() 
{
	return this.pathGoal;
}

UnitMotionBasicSingle.prototype.HasReachedGoal = function()
{
	let pos = this.unit.pos;
	if (this.pathGoalNavcell == this.grid.GetCellId(pos.x, pos.y))
		return true;
	return false;
}

UnitMotionBasicSingle.prototype.GetPathGoalNavcell = function() 
{
	return this.pathGoalNavcell;
}

UnitMotionBasicSingle.prototype.OnTurn = function(turn, timePassed)
{
	// It's more convenient to calculate speed in m/s instead of m/msec
	
//	timePassed = 250; // use for debugging
	let timeLeft = timePassed / 1000;

	if (this.pathGoal.length() == 0 || this.HasReachedGoal())
		return;

	if (!this.longPath && this.shortPaths.length == 0) {
		let start = this.grid.GetCellId(this.unit.pos.x, this.unit.pos.y, {}, {});
		let goal = this.pathGoalNavcell;
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
		
		if (pathVec.length() > this.speed * timeLeft) {
			let moveVec = Vector2D.clone(pathVec);
			let moveLen = this.speed * timeLeft;
			moveVec.mult(moveLen/moveVec.length());
			this.unit.pos.add(moveVec);
			pathVec = pathVec.mult((pathVec.length() - moveLen) / pathVec.length())
			return;
		}
		else {
			this.unit.pos.add(pathVec);
			// timeLeft in seconds, speed in meters per second
			timeLeft -= pathVec.length() / this.speed;
			this.shortPaths.shift();
		}
	}
	
//	// move as much as it would be possible according to time passed since last movement and
//	// unit speed. Stop moving if the goal is reached.
//	while (timeLeft && this.pathGoal.length() != 0) {
//		let wp = shortPaths.shift(); // next waypoint
//		let moveVec = Vecto2D.sub(wp, this.unit.pos);
//
//		if (moveVec.length() > this.speed * timeLeft) {
//			let newLen = moveVec.length() - this.speed;
//			moveVec.mult(newLen/moveVec.length());
//			shortPaths.unshift(wp); // didn't reach the waypoint, add it again.
//			this.unit.pos.add(moveVec); // move
//			return;
//		}
//		else {
//			this.unit.pos = wp; // move to waypoint
//			// reduce timeLeft according to speed
//			// timeLeft in milliseconds, speed in meters per second
//			timeLeft -= Vector2D.sub(this.unit.pos, wp).length() / this.speed;
//		}
//	}
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
