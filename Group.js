function Group()
{
	this.id = -1;
	this.pos = new Vector2D();
	this.avgPos = new Vector2D();
	this.movePos = new Vector2D();
	this.orientation = -1; // / 180 * Math.PI; // convert to radians
	this.selected = false
	this.color = "#000000FF";
	this.pathGoal = new Vector2D();

	this.formationType = "none";
	this.units = [];
	this.avgUnitObstr;
	this.unitType = "group";

	this.speed = 1.0;
}

Group.prototype.Init = function(id, posX, posZ, orientation, formationType, units)
{
	this.id = id;
	this.movePos = new Vector2D(posX, posZ);
	this.pos = new Vector2D(posX, posZ);
	this.orientation = orientation; // / 180 * Math.PI; // convert to radians
	this.selected = false
	this.color = "#000000FF";
	this.formationType = formationType;
	this.units = units;
	this.CalculateAverageUnitObstruction();
	let spots = this.GetUnitSpots();
	for (let i = 0; i < units.length; ++i) {
		this.units[i].pos = Vector2D.add(this.movePos, spots[i]);
	}
}

Group.prototype.SaveState = function(state)
{
	state.id = this.id;
	state.posX = this.pos.x;
	state.posY = this.pos.y;
	state.avgPosX = this.avgPos.x;
	state.avgPosY = this.avgPos.y;
	state.movePosX = this.movePos.x;
	state.movePosY = this.movePos.y;
	state.orientation = this.orientation;
	state.selected = this.selected;
	state.color = this.color;
	state.pathGoalX = this.pathGoal.x;
	state.pathGoalY = this.pathGoal.y;
	state.formationType = this.formationType;
	state.units = [];
	for (let unit of this.units) {
		let unitState = {};
		unit.SaveState(unitState);
		state.units.push(unitState);
	}
}

Group.prototype.GetAvgPos = function()
{
	return this.avgPos;
}

Group.prototype.GetMovePos = function()
{
	return this.movePos;
}

Group.prototype.CalculateAverageUnitObstruction = function()
{
	this.avgUnitObstr = 0;
	for (let unit of this.units) {
		this.avgUnitObstr += unit.obstructionSize;
	}
	this.avgUnitObstr /= this.units.length;
}

Group.prototype.LoadState = function(state)
{
	this.id = state.id;
	this.pos = new Vector2D(state.posX, state.posY);
	this.avgPos = new Vector2D(state.avgPosX, state.avgPosY);
	this.movePos = new Vector2D(state.movePosX, state.movePosY);
	this.orientation = state.orientation;
	this.selected = state.selected;
	this.color = state.color;
	this.pathGoal = new Vector2D(state.pathGoalX, state.pathGoalY);
	this.formationType = state.formationType;
	this.units = [];
	for (let unitState of state.units) {
		let unit = new Unit();
		unit.LoadState(unitState);
		this.units.push(unit);
	}
	this.CalculateAverageUnitObstruction();
}

Group.prototype.SetPathGoal = function(posX, posZ)
{
	this.pathGoal.set(posX, posZ);
}

Group.prototype.GetPathGoal = function()
{
	return this.pathGoal;
}

Group.prototype.SetSelected = function(selected)
{
	if (selected) {
		this.color = "#000000FF";
		this.selected = true;
	}
	else {
		this.color = "#000000FF";
		this.selected = false;
	}

	for (let unit of this.units)
		unit.SetSelected(selected);
}

Group.prototype.onTick = function()
{
}

// Inspired and partially copied from prototype.ComputeFormationOffsets in 0 A.D.'s Formation.js
Group.prototype.GetUnitSpots = function(nbrUnits1)
{

/* Example data for a formation:
 *    shape: "box",
 *    rowSpacing: 1.0,
 *    colSpacing: 0.5,
 *    widthDepthRatio: 4
 */
	let spots = [];

	let nbrUnits = this.units.length;
	if (nbrUnits1)
		nbrUnits = nbrUnits1;

	let fDef = FormationDefinitions[this.formationType];

	let depth = Math.sqrt(nbrUnits / fDef.widthDepthRatio);
	let cols = Math.ceil(nbrUnits / Math.ceil(depth));

	if (fDef.shape == "box") {

		let left = nbrUnits;
		let row = 0;
		while (left > 0) {
			let z = -row * (fDef.rowSpacing + this.avgUnitObstr);
			// switch between the left and right side of the center
			let side = 1;
			for (let col = 0; col < cols; ++col) {
				side *= -1;
				if (col%2 == 0)
					var x = side * (Math.floor(col/2) + 0.5) * (fDef.colSpacing + this.avgUnitObstr);
				else
					var x = side * (Math.ceil(col/2) - 0.5) * (fDef.colSpacing + this.avgUnitObstr);

				spots.push(new Vector2D(x, z));
				--left;
			}
			++row;
		}
	}
	else {
		alert("unknown formation shape!");
	}

	// We use a coordinate system where 0° orientation is along the x-axis, so we have to rotate 90°.
	for (let i = 0; i < spots.length; ++i) {
		spots[i].rotate(Math.PI * 0.5);
		spots[i].rotate(this.orientation);
	}

	return spots;
}
