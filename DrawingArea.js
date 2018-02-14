function DrawingArea(canvas, grid, coordSpace)
{
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	this.grid = grid;
	this.coordSpace = coordSpace;
	this.isMouseDown = false;
	this.lastCellX = false;
	this.lastCellY = false;
}

DrawingArea.prototype.DrawGrid = function() {
	let borderPixel = 1;
	let borderColor = "#d3d3d3";
	let cellWidth = this.canvas.width / this.grid.cols;
	let cellHeight = this.canvas.height / this.grid.rows;

	for (let i = 0; i < this.grid.rows; i++) {
		for (let j = 0; j < this.grid.cols; j++) {
			
			// transfor to canvas coordinate system (top-left origin)
			// use "i" to read and "iTrans" to write
			let iTrans = this.grid.rows - 1 - i;

			// draw border (lines of the grid)
			this.ctx.fillStyle = borderColor;
			this.ctx.fillRect(j * cellWidth, iTrans * cellHeight, cellWidth, cellHeight);
			
			// white = passable, black = not passable
			let gridVal = this.grid.grid[i * this.grid.cols + j];
			if (gridVal == 1) // passable
				this.ctx.fillStyle = "#000000";
			else if (gridVal == 2) // open set
				this.ctx.fillStyle = "#00FF00";
			else if (gridVal == 3) // closed set
				this.ctx.fillStyle = "#FF0000";
			else if (gridVal == 4) // path set
				this.ctx.fillStyle = "#0000FF";
			else if (gridVal == 0)
				this.ctx.fillStyle = "#FFFFFF";
			else
				alert("invalid grid value of " + gridVal + "!");
			
			// draw cell
			this.ctx.fillRect(j * cellWidth + borderPixel, 	// startX
				iTrans * cellHeight + borderPixel, // startY
				cellWidth - 2 * borderPixel,	// width
				cellHeight - 2 * borderPixel 	// height
			);
		}
	}
}

DrawingArea.prototype.DrawUnit = function(unit) {

	let radius = 0;
	let centerX = 0;
	let centerY = 0;

	// draw path goal (draw that first so that the unit is drawn on top of the goal indicator)
	let pathGoal = unit.GetPathGoal();
	if (pathGoal.length() != 0 && unit.selected) {
	
		// It's a bit confusing because the pathGoal vector uses x and y properties to store the world space x and z coordinates
		centerX = this.canvas.width * pathGoal.x / this.coordSpace.maxWidth;
		centerY = this.canvas.height * (this.coordSpace.maxHeight - pathGoal.y) / this.coordSpace.maxHeight;
		radius = 9;
		this.ctx.beginPath();
		this.ctx.moveTo(centerX, centerY);
		this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = "#00dd00";
		this.ctx.fill();
		this.ctx.closePath();

		radius = 6;
		this.ctx.beginPath();
		this.ctx.moveTo(centerX, centerY);
		this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = "#000000";
		this.ctx.fill();
		this.ctx.closePath();
	
		radius = 3;
		this.ctx.beginPath();
		this.ctx.moveTo(centerX, centerY);
		this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = "#00dd00";
		this.ctx.fill();
		this.ctx.closePath();
	}

	// draw a circle representing the unit obstruction

	// transform from map coordiante system to canvas coordinate system
	centerX = this.canvas.width * unit.pos.x / this.coordSpace.maxWidth; 
	centerY = this.canvas.height * (this.coordSpace.maxHeight - unit.pos.y) / this.coordSpace.maxHeight;

	// TODO: maybe the coordinate space should be square-only (same maxWidth as maxHeight).
	// Here we just scale the radius of the circle based on the width
	radius = this.canvas.width * (unit.obstructionSize / 2) / this.coordSpace.maxWidth;

	this.ctx.beginPath();
	this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	this.ctx.fillStyle = unit.color;
	this.ctx.fill();
	this.ctx.closePath();
	//this.ctx.lineWidth = 5;
	//this.ctx.strokeStyle = "#0000FF";
	//this.ctx.stroke();

	this.ctx.beginPath();
	this.ctx.moveTo(centerX, centerY);

	// * -1 because of the different coordinate system 
	let toX = centerX - Math.cos(unit.orientation) * radius * -1;
	let toY = centerY + Math.sin(unit.orientation + Math.PI) * radius * -1;

	this.ctx.lineTo(toX, toY);
	this.ctx.lineWidth = 2;
	this.ctx.strokeStyle = "#FF0000";
	this.ctx.stroke();
	this.ctx.closePath();
}

DrawingArea.prototype.DrawGroup = function(group) {

	let centerX = 0;
	let centerY = 0;
	var radius = 0;

	// draw path goal (draw that first so that the group is drawn on top of the goal indicator)
	let pathGoal = group.GetPathGoal();
	if (pathGoal.length() != 0 && group.selected) {

		// It's a bit confusing because the pathGoal vector uses x and y properties to store the world space x and z coordinates
		centerX = this.canvas.width * pathGoal.x / this.coordSpace.maxWidth;
		centerY = this.canvas.height * (this.coordSpace.maxHeight - pathGoal.y) / this.coordSpace.maxHeight;
		radius = 9;
		this.ctx.beginPath();
		this.ctx.moveTo(centerX, centerY);
		this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = "#00dd00";
		this.ctx.fill();
		this.ctx.closePath();

		radius = 6;
		this.ctx.beginPath();
		this.ctx.moveTo(centerX, centerY);
		this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = "#000000";
		this.ctx.fill();
		this.ctx.closePath();

		radius = 3;
		this.ctx.beginPath();
		this.ctx.moveTo(centerX, centerY);
		this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = "#00dd00";
		this.ctx.fill();
		this.ctx.closePath();
	}

	for (let unit of group.units) {
		this.DrawUnit(unit);
	}

	// draw a point for each unit spot in the group

	unitSpots = group.GetUnitSpots();
	for (spot of unitSpots) {
		let pos = Vector2D.clone(spot);
		pos.add(group.movePos);
		radius = 2;
		// transform from map coordiante system to canvas coordinate system
		centerX = this.canvas.width * pos.x / this.coordSpace.maxWidth;
		centerY = this.canvas.height * (this.coordSpace.maxHeight - pos.y) / this.coordSpace.maxHeight;

		this.ctx.beginPath();
		this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = group.color;
		this.ctx.fill();
		this.ctx.closePath();
	}

	// draw a line showing the direction of the group
	centerX = this.canvas.width * group.movePos.x / this.coordSpace.maxWidth; 
	centerY = this.canvas.height * (this.coordSpace.maxHeight - group.movePos.y) / this.coordSpace.maxHeight;
	this.ctx.beginPath();
	this.ctx.moveTo(centerX, centerY);

	// * -1 because of the different coordinate system
	radius = 20;
	let toX = centerX - Math.cos(group.orientation) * radius * -1;
	let toY = centerY + Math.sin(group.orientation + Math.PI) * radius * -1;

	this.ctx.lineTo(toX, toY);
	this.ctx.lineWidth = 2;
	this.ctx.strokeStyle = group.color;
	this.ctx.stroke();
	this.ctx.closePath();
}


// Events
DrawingArea.prototype.onMouseDown = function(event)
{
	this.isMouseDown = true;

	let posX = event.pageX - this.canvas.offsetLeft;
	let posY = event.pageY - this.canvas.offsetTop;

	let cellWidth = this.canvas.width / this.grid.cols;
	let cellHeight = this.canvas.height / this.grid.rows;
	this.lastCellX = Math.floor(posX / cellWidth);
	this.lastCellY = Math.floor(posY / cellHeight);

	// Note the conversion from canvas coordinate system (top-left origin) to grid coordinate system (bottom-left origin)
	this.grid.InvertCellAt(posX / this.canvas.width, (this.canvas.height - posY) / this.canvas.height);
}

DrawingArea.prototype.onMouseUp = function(event)
{
	this.isMouseDown = false;
}

DrawingArea.prototype.onMouseOut = function(event)
{
	this.isMouseDown = false;
}

DrawingArea.prototype.onMouseMove = function(event)
{
	if (!this.isMouseDown)
		return;

	let posX = event.pageX - this.canvas.offsetLeft;
	let posY = event.pageY - this.canvas.offsetTop;

	let cellWidth = this.canvas.width / this.grid.cols;
	let cellHeight = this.canvas.height / this.grid.rows;
	let thisCellX = Math.floor(posX / cellWidth);
	let thisCellY = Math.floor(posY / cellHeight);

	// only invert the cell when we move to a different cell
	if (thisCellX != this.lastCellX  || thisCellY != this.lastCellY) {
		// Note the conversion from canvas coordinate system (top-left origin) to grid coordinate system (bottom-left origin)
		this.grid.InvertCell(thisCellX, this.grid.rows - thisCellY -1);
		//this.grid.InvertCellAt(posX / this.canvas.width, (this.canvas.height - posY) / this.canvas.height);
		this.lastCellX = thisCellX;
		this.lastCellY = thisCellY;
	}

}
