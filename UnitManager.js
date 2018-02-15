function UnitManager(grid, visualization, type)
{
	this.grid = grid;
	this.visualization = visualization;
	this.units = [];
	this.unitMotionObjects = [];
	this.nextUnitId = 1;
	this.type = type;

	this.visualization.addVisualizationInfo("longrange");
	this.visualization.addVisualizationInfo("shortrange");
	this.visualization.addVisualizationInfo("vector");
	this.visualization.addVisualizationInfo("flowfield");
	this.visualization.addVisualizationInfo("positions");
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
	state.type = this.type;
}

UnitManager.prototype.LoadState = function(state)
{

	this.units = [];
	this.type = state.type;
	this.nextUnitId = state.nextUnitId;
	for (let unitState of state.units) {
		let unit = {};
		if (this.type == "unit") {
			unit = new Unit();
		} else if (this.type == "group") {
			unit = new Group();
		} else {
			alert("unknown type in UnitManager.prototype.LoadState!");
		}
		unit.LoadState(unitState);
		this.units.push(unit);
	}
}

UnitManager.prototype.SimInit = function(unitMotionConstr)
{
	for (let unit of this.units) {
		this.unitMotionObjects.push(new unitMotionConstr(this.grid, this.visualization, unit));
	}
}

UnitManager.prototype.SimDestroy = function()
{
	this.unitMotionObjects = [];
}

UnitManager.prototype.AddUnit = function(posX, posZ, orientation, obstructionSize)
{
	if (this.type == "unit") {
		var unit = new Unit();
		unit.Init(this.nextUnitId++, posX, posZ, orientation, obstructionSize);
	} else if (this.type == "group") {
		// for now we just add 24 units hardcoded
		let memberUnits = [];
		for (let i = 0; i < 24; ++i) {
			memberUnits.push(new Unit());
			memberUnits[memberUnits.length - 1].Init(this.nextUnitId++, posX, posZ, orientation, obstructionSize);
		}
		var unit = new Group();
		unit.Init(this.nextUnitId++, posX, posZ, orientation, "FormationBox", memberUnits);
	} else
		alert("AddUnit: unknown unit type");

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
	for (unitMotion of this.unitMotionObjects) {
		unitMotion.OnTurn(timePassed, turn);
	}
}

UnitManager.prototype._IsPosOnUnit = function(unit, posX, posZ, clearance) {
	vec = new Vector2D(unit.pos.x - posX, unit.pos.y - posZ);
	return (vec.lengthSquared() <= (unit.obstructionSize / 2 + clearance) * (unit.obstructionSize / 2 + clearance));
}
