function GridAStar(grid)
{
	this.grid = grid;
}

/*
 * A* based on the pseudo-code in the wikipedia article
 * It's a simple implementation and not meant to be fast at all
 */

// The shortest possible distance is going diagonal as long as possible and then only horizontal or vertical
// if we haven't reached the goal yet. This function assumes a square grid.
GridAStar.prototype.heuristicCostEstimate = function(start, goal)
{
	let cols = this.grid.cols;

	let startXCells = start % cols;
	let startZCells = Math.floor(start / cols);
	let goalXCells = goal % cols;
	let goalZCells = Math.floor(goal / cols);
	
	let diffXCells = Math.abs(goalXCells - startXCells);
	let diffZCells = Math.abs(goalZCells - startZCells);
	let x = Math.min(diffXCells, diffZCells);
	// diagonal (pythagoras)
	let dist = Math.sqrt(2)*x;
	dist += Math.abs(diffXCells - diffZCells);
	return dist;
}

GridAStar.prototype.reconstructPath = function(cameFrom, current, ret)
{
	ret["totalPath"] = [current];
	while (cameFrom.has(current)) {
		current = cameFrom.get(current);
		ret["totalPath"].push(current);
	}
}

GridAStar.prototype.aStar = function(start, goal, ret)
{
	ret["start"] = start;
	ret["goal"] = goal;

	// shorter, more readable
	let grid = this.grid.grid;
	let cols = this.grid.cols;
	let rows = this.grid.rows;

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
		let neighborIx = current - cols - 1;
		if (neighborIx >= 0 && current % cols != 0)
			if (grid[neighborIx] != 1) // not obstructed
				neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
		// down
		neighborIx = current - cols;
		if (neighborIx >= 0 && current % cols != cols - 1) 
			if (grid[neighborIx] != 1) // not obstructed
				neighbors.add({ "ix": neighborIx, "dist": 1 });
		// down right
		neighborIx = current - cols + 1;
		if (neighborIx >= 0 && current % cols != cols - 1)
			if (grid[neighborIx] != 1) // not obstructed
				neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
		// left
		neighborIx = current - 1;
		if (current % cols != 0)
			if (this.grid.IsPassable(neighborIx))
				neighbors.add({ "ix": neighborIx, "dist": 1 });
		// right
		neighborIx = current + 1;
		if (current % cols != cols - 1)
			if (this.grid.IsPassable(neighborIx))
				neighbors.add({ "ix": neighborIx, "dist": 1 });
		// up left
		neighborIx = current + cols - 1;
		if (neighborIx < cols * rows && current % cols != 0)
			if (this.grid.IsPassable(neighborIx))
				neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
		// up
		neighborIx = current + cols;
		if (neighborIx < cols * rows)
			if (this.grid.IsPassable(neighborIx))
				neighbors.add({ "ix": neighborIx, "dist": 1 });
		// up right
		neighborIx = current + cols + 1;
		if (neighborIx < cols * rows && current % cols != cols - 1)
			if (this.grid.IsPassable(neighborIx))
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
