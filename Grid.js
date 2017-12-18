function Grid(coordSpace, visualization) {

	// For now, hardcode the grid resolution to 1
	this.width = coordSpace.maxWidth;
	this.height = coordSpace.maxHeight;
	this.cols = coordSpace.maxWidth;
	this.rows = coordSpace.maxHeight;
	this.cellWidth = 1;
	this.cellHeight = 1;
	
	this.grid = new Uint8Array(this.cols * this.rows);
	this.visualization = visualization;
}

Grid.prototype.SaveState = function(state) {
	state.width = this.width;
	state.height = this.height;
	state.cols = this.cols;
	state.rows = this.rows;
	state.cellWidth = this.cellWidth;
	state.cellHeight = this.cellHeight;
	state.grid = this.grid.slice();
}

Grid.prototype.LoadState = function(state) {
	this.width = state.width;
	this.height = state.height;
	this.cols = state.cols;
	this.rows = state.rows;
	this.cellWidth = state.cellWidth;
	this.cellHeight = state.cellHeight;
	this.grid = state.grid.slice();
}

Grid.prototype.SetCell = function(col, row, val)
{
	this.grid[row * this.cols + col] = val;
}

Grid.prototype.GetCellId = function(posX, posZ, row, col)
{
	if (posX >= this.width || posZ >= this.height) {
		alert("Passed a posX or posZ to GetCellId which is not inside the coordinate system's boundaries");
		return 0;
	}
	col = Math.floor(this.cols * posX / this.width);
	row = Math.floor(this.rows * posZ / this.height);
	return row * this.cols + col;
}

Grid.prototype.IsPassable = function(col, row)
{
	let ix = row * this.cols + col;
	return this.grid[ix] != 1;
}

Grid.prototype.IsPassable = function(ix)
{
	return this.grid[ix] != 1;
}


Grid.prototype.InvertCell = function(col, row)
{
	let ix = row * this.cols + col;
	this.grid[ix] = this.grid[ix] == 0 ? 1 : 0;
}

// Invert the given cell
// The cell is identified as a fraction of the total width or height
Grid.prototype.InvertCellAt = function(xRel, zRel)
{
	this.InvertCell(Math.floor(this.cols * xRel), Math.floor(this.rows * zRel));
}

/*
 * A* based on the pseudo-code in the wikipedia article
 * It's a simple implementation and not meant to be fast at all
 */

// The shortest possible distance is going diagonal as long as possible and then only horizontal or vertical
// if we haven't reached the goal yet. This function assumes a square grid.
Grid.prototype.heuristicCostEstimate = function(start, goal)
{
	let startXCells = start % this.cols;
	let startZCells = Math.floor(start / this.cols);
	let goalXCells = goal % this.cols;
	let goalZCells = Math.floor(goal / this.cols);
	
	let diffXCells = Math.abs(goalXCells - startXCells);
	let diffZCells = Math.abs(goalZCells - startZCells);
	let x = Math.min(diffXCells, diffZCells);
	// diagonal (pythagoras)
	let dist = Math.sqrt(2)*x;
	dist += Math.abs(diffXCells - diffZCells);
	return dist;
}

Grid.prototype.reconstructPath = function(cameFrom, current, ret)
{
	ret["totalPath"] = [current];
	while (cameFrom.has(current)) {
		current = cameFrom.get(current);
		ret["totalPath"].push(current);
	}
}

Grid.prototype.aStar = function(start, goal, ret)
{
	ret["start"] = start;
	ret["goal"] = goal;
	// The set of nodes already evaluated.
	let closedSet = new Set();
	// The set of currently discovered nodes that are not evaluated yet.
	// Initially, only the start node is known.
	let openSet = new Set();
	openSet.add(start);
	// For each node, which node it can most efficiently be reached from.
	// If a node can be reached from many nodes, cameFrom will eventually contain the
	// most efficient previous step.
	let cameFrom = new Map();
	// For each node, the cost of getting from the start node to that node.
	let gScore = new Map();
	// The cost of going from start to start is zero.
	gScore.set(start, 0);
	// For each node, the total cost of getting from the start node to the goal
	// by passing by that node. That value is partly known, partly heuristic.
	let fScore = new Map();
	// For the first node, that value is completely heuristic.
	fScore.set(start, this.heuristicCostEstimate(start, goal));
	
	let neighbors = new Set();
	
	while (openSet.size > 0) {
		let current = openSet.values().next().value; // basically any value from the set to start with... 

		// Get the node in the openSet having the lowest fScore value
		for (let node of openSet.values())
			if (fScore.get(node) < fScore.get(current))
				current = node;
		
		if (current == goal) {
			ret["openSet"] = openSet;
			ret["closedSet"] = closedSet;
			this.reconstructPath(cameFrom, current, ret);
			
			// TODO: store that as an additional layer or something instead of adding it
			// to the grid directly (we might not want to display this information).
			let overlayObj = {};
			overlayObj["displayName"] = "A* overlay";
			overlayObj["nodeTypeNames"] = [ "Open", "Closed", "Path"];
			overlayObj["nodes"] = new Map();
			for (let node of openSet)
				overlayObj["nodes"].set(node, 0);
			for (let node of closedSet)
				overlayObj["nodes"].set(node, 1);
			for (let node of ret["totalPath"])
				overlayObj["nodes"].set(node, 2);
					
			ret["visualizationSummaryData"] = overlayObj; 

			return; // TODO
		}
		
		openSet.delete(current);
		closedSet.add(current)
		
		// Get all neighbors
		neighbors.clear();
		// down left
		let neighborIx = current - this.cols - 1;
		if (neighborIx >= 0 && current % this.cols != 0)
			if (this.grid[neighborIx] != 1) // not obstructed
				neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
		// down
		neighborIx = current - this.cols;
		if (neighborIx >= 0 && current % this.cols != this.cols - 1) 
			if (this.grid[neighborIx] != 1) // not obstructed
				neighbors.add({ "ix": neighborIx, "dist": 1 });
		// down right
		neighborIx = current - this.cols + 1;
		if (neighborIx >= 0 && current % this.cols != this.cols - 1)
			if (this.grid[neighborIx] != 1) // not obstructed
				neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
		// left
		neighborIx = current - 1;
		if (current % this.cols != 0)
			if (this.IsPassable(neighborIx))
				neighbors.add({ "ix": neighborIx, "dist": 1 });
		// right
		neighborIx = current + 1;
		if (current % this.cols != this.cols - 1)
			if (this.IsPassable(neighborIx))
				neighbors.add({ "ix": neighborIx, "dist": 1 });
		// up left
		neighborIx = current + this.cols - 1;
		if (neighborIx < this.cols * this.rows && current % this.cols != 0)
			if (this.IsPassable(neighborIx))
				neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
		// up
		neighborIx = current + this.cols;
		if (neighborIx < this.cols * this.rows)
			if (this.IsPassable(neighborIx))
				neighbors.add({ "ix": neighborIx, "dist": 1 });
		// up right
		neighborIx = current + this.cols + 1;
		if (neighborIx < this.cols * this.rows && current % this.cols != this.cols - 1)
			if (this.IsPassable(neighborIx))
				neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
			
		for (let neighbor of neighbors) {
			if (closedSet.has(neighbor.ix))
				continue;
			
			let tentative_gScore = gScore.get(current) + neighbor.dist;
			if (!openSet.has(neighbor.ix))
				openSet.add(neighbor.ix);
			else if (tentative_gScore >= gScore.get(neighbor.ix)) // if we have it in the open set, we also have a gScore
				continue; // This is not a better path

			cameFrom.set(neighbor.ix, current);
			gScore.set(neighbor.ix, tentative_gScore);
			fScore.set(neighbor.ix, tentative_gScore + this.heuristicCostEstimate(neighbor.ix, goal));
		}
	}
	
	alert("no path found!");
}


