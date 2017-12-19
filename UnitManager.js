function UnitManager(grid, visualization, unitMotionConstr)
{
	this.grid = grid;
	this.visualization = visualization;
	this.unitMotionContr = unitMotionConstr;
	this.units = [];
	this.nextUnitId = 1;
}

UnitManager.prototype.SaveState = function(state)
{

	state.units = [];
	for (let unit of this.units) {
		let unitState = {};
		unit.SaveState(unitState); 
		state.units.push(unitState)
	}
	state.nextUnitId = this.nextUnitId;
}

UnitManager.prototype.LoadState = function(state)
{

	this.units = [];

	for (let unitState of state.units) {
		let unit = new Unit(this.grid, this.visualization, this.unitMotionContr);
		unit.LoadState(unitState);
		this.units.push(unit);
	}
	this.nextUnitId = state.nextUnitId;
}

UnitManager.prototype.AddUnit = function(posX, posZ, orientation, obstructionSize)
{
	let unit = new Unit(this.grid, this.visualization, this.unitMotionContr)
	unit.Init(this.nextUnitId++, posX, posZ, orientation, obstructionSize);
	this.units.push(unit);
	return unit;
}

UnitManager.prototype.GetUnitAt = function(posX, posZ)
{
	let unitManager = this;
	let unitsFound = this.units.filter( function(unit) { return unitManager._IsPosOnUnit(unit, posX, posZ, 0) } );
	
	if (unitsFound.length == 0) 
		return false;
	
	// should never happen...
	if (unitsFound.length != 1)
		alert("ERROR: found more than 1 units at the same location!");
	
	return unitsFound[0];
}

UnitManager.prototype.IsSpaceFree = function(posX, posZ, clearance)
{
	let unitManager = this;
	let unitsFound = this.units.filter( function(unit) { return unitManager._IsPosOnUnit(unit, posX, posZ, clearance) } );

	if (unitsFound.length != 0) 
		return false;
	
	return true;
}

UnitManager.prototype.DeleteUnitAt = function(posX, posZ)
{
	for (let i = 0; i < this.units.length; i++) {
		if (this._IsPosOnUnit(this.units[i], posX, posZ, 0))
			return this.units.splice(i, 1);		
	}
	return []; 
}

UnitManager.prototype.OnTurn = function(timePassed, turn)
{
	for (unit of this.units) {
		unit.unitMotion.OnTurn(timePassed, turn);
	}
}

UnitManager.prototype._IsPosOnUnit = function(unit, posX, posZ, clearance) {
	vec = new Vector2D(unit.pos.x - posX, unit.pos.y - posZ);
	return (vec.lengthSquared() <= (unit.obstructionSize / 2 + clearance) * (unit.obstructionSize / 2 + clearance));
}
