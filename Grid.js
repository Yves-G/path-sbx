function Grid(coordSpace, type) {

	// For now, hardcode the grid resolution to 1
	this.width = coordSpace.maxWidth;
	this.height = coordSpace.maxHeight;
	this.cols = coordSpace.maxWidth;
	this.rows = coordSpace.maxHeight;
	this.cellWidth = 1;
	this.cellHeight = 1;
	this.colsOffset = coordSpace.offsetLeft
	this.rowsOffset = coordSpace.offsetBottom
	
	if (type === undefined)
		var type = "Uint8";

	switch (type) {
		case "Uint8":
			this.grid = new Uint8Array(this.cols * this.rows);
			break;
		case "Float32":
			this.grid = new Float32Array(this.cols * this.rows);
			break;
		default:
			alert("Type: " + type + " is unknown!");
	}
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

// Make all cells on the sides of the grid impassable. This is useful for preventing units from leaving
// the map without having to write additional code for that task.
Grid.prototype.CreateImpassableBorders = function()
{
	for (let i = 0; i < this.rows; ++i) {
		this.grid[i * this.cols] = 1;
		this.grid[i * this.cols + this.cols - 1] = 1;
	}

	for (let i = 1; i < this.cols - 1; ++i) {
		this.grid[i] = 1;
		this.grid[(this.rows -1) * this.cols + i] = 1;
	}
}

Grid.prototype.SetCell = function(col, row, val)
{
	this.grid[row * this.cols + col] = val;
}

// Sometimes you have smaller grids representing regions of the full grid and you have to convert
// cell IDs between these two grids in order to access the same cell in both grids. You might even
// have two sub regions and need to convert cell IDs between these.
// This function does the conversion based on the "colsOffset" and "rowsOffset" values of the two grids.
Grid.prototype.CellIdFromOtherGrid = function(cellId, otherGrid)
{
	let ret;
	let otherRowCol = otherGrid.GetCellRowColC(cellId);
	let globRowCol = {};
	globRowCol.col = otherGrid.colsOffset + otherRowCol.col;
	globRowCol.row = otherGrid.rowsOffset + otherRowCol.row;
	return this.GetCellIdC(globRowCol.row - this.rowsOffset, globRowCol.col - this.colsOffset);
}

Grid.prototype.GetCellIdP = function(posX, posZ)
{
	if (posX >= this.width || posZ >= this.height) {
		alert("Passed a posX or posZ to GetCellIdP which is not inside the coordinate system's boundaries");
		return 0;
	}
	let col = Math.floor(this.cols * posX / this.width);
	let row = Math.floor(this.rows * posZ / this.height);
	return row * this.cols + col;
}

Grid.prototype.GetCellIdC = function(row, col)
{
	if (row >= this.rows || row < 0 || col >= this.cols || col < 0) {
		alert("Passed a row or col to GetCellIdC which is not inside the boundaries");
		return 0;
	}
	return row * this.cols + col;
}

Grid.prototype.GetCellRowColP = function(posX, posZ)
{
	let ret = {};

	ret.col = Math.floor(this.cols * posX / this.width);
	ret.row = Math.floor(this.rows * posZ / this.height);

	// clamp
	ret.col = Math.min(Math.max(ret.col, 0), this.cols);
	ret.row = Math.min(Math.max(ret.row, 0), this.rows);

	return ret;
}

Grid.prototype.GetCellRowColC = function(cell)
{
	let ret = {};
	ret.col = cell % this.cols;
	ret.row = Math.floor(cell / this.cols);
	return ret;
}

Grid.prototype.IsPassable = function(ix)
{
	return this.grid[ix] != 1;
}

Grid.prototype.GetNeighbors = function(current)
{
	let neighbors = new Set();

	let cols = this.cols;
	let rows = this.rows;

	// down left
	let neighborIx = current - cols - 1;
	if (neighborIx >= 0 && current % cols != 0)
		if (this.IsPassable(neighborIx))
			neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
	// down
	neighborIx = current - cols;
	if (neighborIx >= 0)
		if (this.IsPassable(neighborIx))
			neighbors.add({ "ix": neighborIx, "dist": 1 });
	// down right
	neighborIx = current - cols + 1;
	if (neighborIx >= 0 && current % cols != cols - 1)
		if (this.IsPassable(neighborIx))
			neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
	// left
	neighborIx = current - 1;
	if (current % cols != 0)
		if (this.IsPassable(neighborIx))
			neighbors.add({ "ix": neighborIx, "dist": 1 });
	// right
	neighborIx = current + 1;
	if (current % cols != cols - 1)
		if (this.IsPassable(neighborIx))
			neighbors.add({ "ix": neighborIx, "dist": 1 });
	// up left
	neighborIx = current + cols - 1;
	if (neighborIx < cols * rows && current % cols != 0)
		if (this.IsPassable(neighborIx))
			neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });
	// up
	neighborIx = current + cols;
	if (neighborIx < cols * rows)
		if (this.IsPassable(neighborIx))
			neighbors.add({ "ix": neighborIx, "dist": 1 });
	// up right
	neighborIx = current + cols + 1;
	if (neighborIx < cols * rows && current % cols != cols - 1)
		if (this.IsPassable(neighborIx))
			neighbors.add({ "ix": neighborIx, "dist": Math.sqrt(2) });

	return neighbors;
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
