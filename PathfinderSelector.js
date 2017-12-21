function PathfinderSelector() {
	this.pathfinders = new Map();
}

PathfinderSelector.prototype.AddPathfinder = function(displayName, description, unitMotionConstructor)
{
	this.pathfinders.set(displayName, { "displayName": displayName, "description": description, "unitMotionConstructor": unitMotionConstructor });
}

PathfinderSelector.prototype.GetPathfinders = function()
{
	return this.pathfinders;
}
