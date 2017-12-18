function Pencil() {
	this.pencilTypes = new Map();
	this.activePencilType = "";
	this.isEnabled = true;
}

Pencil.prototype.AddType = function(pencilType, usageDesc, cbObj, cbOnClick, cbOnMouseDown = false, cbOnMouseUp = false, cbOnMouseMove = false, cbOnMouseOut = false, cbOnKeyDown = false, cbOnKeyUp = false)
{
	if (this.pencilTypes.has(pencilType)) {
		alert("Tried to add the same pencilType twice!");
		return;	
	}
	this.pencilTypes.set(pencilType, 
		{ 
			"cbOnClick": cbOnClick,
			"cbOnMouseDown": cbOnMouseDown,
			"cbOnMouseUp": cbOnMouseUp,
			"cbOnMouseMove": cbOnMouseMove,
			"cbOnMouseOut": cbOnMouseOut,
			"cbOnKeyDown": cbOnKeyDown,
			"cbOnKeyUp": cbOnKeyUp,
			"cbObj": cbObj, 
			"usageDesc": usageDesc 
		}
	);
}

Pencil.prototype.SetEnabled = function(enabled)
{
	this.isEnabled = !!enabled;
}
	
Pencil.prototype.SetActive = function(pencilType)
{
	if (!this.pencilTypes.has(pencilType)) {
		alert("Unknown pencil type selected: " + pencilType + "!");
		return;
	}	

	this.activePencilType = pencilType;
}

Pencil.prototype.GetUsageDesc = function()
{
	if (this.activePencilType == "") {	
		alert("No pencil active!");
		return;
	}
	
	return this.pencilTypes.get(this.activePencilType).usageDesc;
}

Pencil.prototype.onClick = function(event) 
{
	if (!this.isEnabled)
		return;

	if (this.activePencilType == "") {	
		alert("No pencil active!");
		return;
	}

	obj = this.pencilTypes.get(this.activePencilType);
	if (obj.cbOnClick)
		obj.cbOnClick.call(obj.cbObj, event);
}

Pencil.prototype.onMouseDown = function(event) 
{
	if (!this.isEnabled)
		return;	
	
	if (this.activePencilType == "") {	
		alert("No pencil active!");
		return;
	}

	obj = this.pencilTypes.get(this.activePencilType);
	if (obj.cbOnMouseDown)
		obj.cbOnMouseDown.call(obj.cbObj, event);
}

Pencil.prototype.onMouseUp = function(event) 
{
	if (!this.isEnabled)
		return;

	if (this.activePencilType == "") {	
		alert("No pencil active!");
		return;
	}

	obj = this.pencilTypes.get(this.activePencilType);
	if (obj.cbOnMouseUp)
		obj.cbOnMouseUp.call(obj.cbObj, event);
}

Pencil.prototype.onMouseMove = function(event) 
{
	if (!this.isEnabled)
		return;

	if (this.activePencilType == "") {	
		alert("No pencil active!");
		return;
	}

	obj = this.pencilTypes.get(this.activePencilType);
	if (obj.cbOnMouseMove)
		obj.cbOnMouseMove.call(obj.cbObj, event);
}

Pencil.prototype.onMouseOut = function(event) 
{
	if (!this.isEnabled)
		return;

	if (this.activePencilType == "") {	
		alert("No pencil active!");
		return;
	}

	obj = this.pencilTypes.get(this.activePencilType);
	if (obj.cbOnMouseOut)
		obj.cbOnMouseOut.call(obj.cbObj, event);
}

Pencil.prototype.onKeyDown = function(event)
{
	if (!this.isEnabled)
		return;

	if (this.activePencilType == "")
		return;
	
	let obj = this.pencilTypes.get(this.activePencilType);
	if (obj.cbOnKeyDown)
		obj.cbOnKeyDown.call(obj.cbObj, event);
}

Pencil.prototype.onKeyUp = function(event)
{
	if (!this.isEnabled)
		return;

	if (this.activePencilType == "")
		return;
	
	let obj = this.pencilTypes.get(this.activePencilType);
	if (obj.cbOnKeyUp)
		obj.cbOnKeyUp.call(obj.cbObj, event);	
}


