function UnitCreator(canvas, coordSpace, unitManager)
{
	this.canvas = canvas;
	this.coordSpace = coordSpace;
	this.unitManager = unitManager;
	
	this.selectedUnit = false;

	this.moveMode = false;
	this.mKeyDown = false;
	this.dKeyDown = false;
}



UnitCreator.prototype.OnClick = function(event)
{
}

UnitCreator.prototype.OnMouseDown = function(event)
{
	this.lastPageX = event.pageX;
	this.lastPageY = event.pageY;
	this.mouseDown = true;
}

UnitCreator.prototype.OnMouseUp = function(event)
{
	if (!this.mouseDown) // mouse entered the canvas with the button already down
		return;

	let dX = event.pageX - this.lastPageX;
	let dY = event.pageY - this.lastPageY;
	let angle = Math.atan2(dY, dX);
	

	let relX = (this.lastPageX - this.canvas.offsetLeft) / this.canvas.width;
	let relY = (this.canvas.height - this.lastPageY + this.canvas.offsetTop) / this.canvas.height;
	let posX = relX * coordSpace.maxWidth;
	let posZ = relY * coordSpace.maxHeight;
	
	// delete unit
	if (this.dKeyDown) { 
		let unitsDeleted = this.unitManager.DeleteUnitAt(posX, posZ);
		if (unitsDeleted.length == 1)
			if (this.selectedUnit && unitsDeleted[0].id == this.selectedUnit.id)
				this.selectedUnit = false;
	}
	// set move orders
	else if (this.mKeyDown) {
		if (!this.selectedUnit)
			return;
		this.selectedUnit.SetPathGoal(posX, posZ);
	}
	// create/select unit
	else { 
		// If there's a unit on that spot, select it. Otherwise create a new unit there.
		if (this.selectedUnit)
			this.selectedUnit.SetSelected(false);
		this.selectedUnit = this.unitManager.GetUnitAt(posX, posZ);

		if (!this.selectedUnit) {
			if (unitManager.IsSpaceFree(posX, posZ, 0.5))
				this.selectedUnit = this.unitManager.AddUnit(posX, posZ, angle, 1);
		}
	}

	// Display information about selected unit and update "selected" state.
	let div = document.querySelector("#selectionStatusDiv");
	if (this.selectedUnit) {
		
		this.selectedUnit.SetSelected(true);
		let pathGoal = this.selectedUnit.GetPathGoal();
		div.innerHTML = "Position: " + Math.round(this.selectedUnit.pos.x * 100) / 100 + " / " + Math.round(this.selectedUnit.pos.y * 100) / 100 + "<br /\>" +
			"Obstruction size: " + Math.round(this.selectedUnit.obstructionSize * 100) / 100 + "<br /\>" +
			"Orientation: " + Math.round(this.selectedUnit.orientation / Math.PI * 180 * 100) / 100 + "&deg; <br /\>" +
			"Path goal: " + Math.round(pathGoal.x * 100) / 100 + "/" + Math.round(pathGoal.y * 100) / 100 + "<br /\>";
	}
	else {
		div.innerHTML = "";
	}
}

UnitCreator.prototype.OnMouseOut = function(event)
{
	this.lastPageX = 0;
	this.lastPageY = 0;
	this.MouseDown = false;
}

UnitCreator.prototype.OnKeyDown = function(event)
{
	let unicode = event.keyCode ? event.keyCode : event.charCode;
	let char = String.fromCharCode(unicode);
	switch(char) {
		case "M":
			this.mKeyDown = true;
		break;
		case "D":
			this.dKeyDown = true;
		break;
		default:
		break;
	}
}

UnitCreator.prototype.OnKeyUp = function(event)
{
	let unicode = event.keyCode ? event.keyCode : event.charCode;
	let char = String.fromCharCode(unicode);
	switch(char) {
		case "M":
			this.mKeyDown = false;
		break;
		case "D":
			this.dKeyDown = false;
		break;
		default:
		break;
	}
}
