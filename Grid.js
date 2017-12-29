function Grid(coordSpace) {

	// For now, hardcode the grid resolution to 1
	this.width = coordSpace.maxWidth;
	this.height = coordSpace.maxHeight;
	this.cols = coordSpace.maxWidth;
	this.rows = coordSpace.maxHeight;
	this.cellWidth = 1;
	this.cellHeight = 1;
	
	this.grid = new Uint8Array(this.cols * this.rows);
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

Grid.prototype.GetCellRowCol = function(posX, posZ)
{
	let ret = {};

	ret.col = Math.floor(this.cols * posX / this.width);
	ret.row = Math.floor(this.rows * posZ / this.height);

	// clamp
	ret.col = Math.min(Math.max(ret.col, 0), this.cols);
	ret.row = Math.min(Math.max(ret.row, 0), this.rows);

	return ret;
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
