function Unit(grid, visualization)
{
	this.id = -1;
	this.pos = new Vector2D();
	this.speed = 1.0; // speed in m/s
	this.obstructionSize = -1;
	this.orientation = -1; // / 180 * Math.PI; // convert to radians
	this.selected = false
	this.color = "#0000FF";
	this.pathGoal = new Vector2D();
}

Unit.prototype.Init = function(id, posX, posZ, orientation, obstructionSize)
{
	this.id = id;
	this.pos = new Vector2D(posX, posZ);
	this.obstructionSize = obstructionSize;
	this.orientation = orientation; // / 180 * Math.PI; // convert to radians
	this.selected = false
	this.color = "#0000FF";
}

Unit.prototype.SaveState = function(state)
{
	state.id = this.id;
	state.posX = this.pos.x;
	state.posY = this.pos.y;
	state.speed = this.speed;
	state.obstructionSize = this.obstructionSize;
	state.orientation = this.orientation;
	state.selected = this.selected;
	state.color = this.color;
	state.pathGoalX = this.pathGoal.x;
	state.pathGoalY = this.pathGoal.y;
}

Unit.prototype.LoadState = function(state)
{
	this.id = state.id;
	this.pos = new Vector2D(state.posX, state.posY);
	this.speed = state.speed;
	this.obstructionSize = state.obstructionSize;
	this.orientation = state.orientation;
	this.selected = state.selected;
	this.color = state.color;
	this.pathGoal = new Vector2D(state.pathGoalX, state.pathGoalY);
}

Unit.prototype.SetPathGoal = function(posX, posZ)
{
	this.pathGoal.set(posX, posZ);
}

Unit.prototype.GetPathGoal = function()
{
	return this.pathGoal;
}

Unit.prototype.SetSelected = function(selected)
{
	if (selected) {
		this.color = "#225b16";
		this.selected = true;
	}
	else {
		this.color = "#0000FF";
		this.selected = false;
	}
}

Unit.prototype.onTick = function()
{
}
