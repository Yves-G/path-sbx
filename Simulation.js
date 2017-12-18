function Simulation()
{
	this.currentTurn = 0;

	// Maps mapping simObject to state data
	this.currentState = new Map();

	this.simObjects = new Map();
}

// timePassed:  time passed since the last turn
Simulation.prototype.OnTurn = function(timePassed)
{
	this.currentTurn++;

	for (let simObj of this.simObjects.values()) {
		if (!simObj.OnTurn || typeof(simObj.OnTurn) != "function")
			continue;
		
		simObj.OnTurn.call(simObj, this.currentTurn, timePassed);
	}
}

Simulation.prototype.GetCurrentTurn = function()
{
	return this.currentTurn;
}

// Register an object that contains relevant state for the simulation.
// This object requires a SaveState and LoadState function.
Simulation.prototype.RegisterSimObject = function(name, simObj)
{
	if (!simObj.SaveState || typeof(simObj.SaveState) != "function")
		alert("Tried to register a SimObject without SaveState function!");
	if (!simObj.LoadState || typeof(simObj.LoadState) != "function")
		alert("Tried to register a SimObject without LoadState function!");

	this.simObjects.set(name, simObj);
}

Simulation.prototype.SaveAllState = function(stateMap) 
{
	stateMap.simObjects = {};
	stateMap.isValid = true;
	for ([name, simObj] of this.simObjects) {
		let state = {};
		simObj.SaveState(state);
		stateMap.simObjects[name] = state;
	}
}

Simulation.prototype.LoadAllState = function(stateMap)
{
	this.currentTurn = 0;
	for (let name in stateMap.simObjects) {
		let simObj = this.simObjects.get(name);
		if (!simObj)
			alert("Error loading state. No SimObject with the given name: " + name);
		simObj.LoadState(stateMap.simObjects[name]);	
	}
	this.currentState = stateMap;
}
