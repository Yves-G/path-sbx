function Visualization(canvas, coordSpace)
{
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	this.canvasOffsetLeft = canvas.offsetLeft;
	this.canvasOffsetTop = canvas.offsetTop;
	this.coordSpace = coordSpace;

	//    turn v  v elementName               v visualizationMode
	//elements[0]["longrange"]["summaryData"]["gridOverlay"]
	//                                       ... remainng properties of summaryData are specific to visualizationMode
	//                        [detailedData"] 
	 
	this.elements = [];
	this.availableVisualizations = new Set();

}

Visualization.prototype.reset = function()
{
	this.elements = [];
}

Visualization.prototype.getVisualizationInfo = function(name)
{
	return this.availableVisualizations;
}

Visualization.prototype.addVisualizationInfo = function(name)
{
	this.availableVisualizations.add(name);
}

// use objId=0 when only one object per elementName is used
Visualization.prototype.addSummaryData = function(elementName, visualizationMode, turn, objId, data)
{
	if (!this.elements[turn])
		this.elements[turn] = {};

	if (!this.elements[turn][elementName])
		this.elements[turn][elementName] = { "summaryData": {}, "summaryVisualizationMode": visualizationMode };

	if (this.elements[turn][elementName].summaryVisualizationMode != visualizationMode)
		alert("Different visualization modes for the same element! ElementName: " + elementName + " visualizationMode: " + 
			visualizationMode + " this.elements[turn][elementName].summaryVisualizationMode: " + 
			this.elements[turn][elementName].summaryVisualizationMode);

	this.elements[turn][elementName].summaryData[objId] = data;
	
}

Visualization.prototype.addDetailedData = function(turn, step, data)
{
}

// use objId=0 when only one object per name is used
Visualization.prototype.drawSummary = function(turn, names, objIds, onlyCurrentTurn)
{
	for (name of names) {
		let vis = this.getVis(turn, name, onlyCurrentTurn);
		
		if (!vis)
			continue;

		// validate valid visualization modes
		if (["gridOverlay", "vectorOverlay", "positionOverlay"].indexOf(vis.summaryVisualizationMode) == -1) {
			alert("Unknown visualization mode: " + vis[summaryVisualizationMode] + "!");
			continue;
		}

		for (objId of objIds) {
		
			if (vis.summaryVisualizationMode == "gridOverlay") {
				this.drawGridOverlay(vis.summaryData[objId]);
				continue;
			}
			if (vis.summaryVisualizationMode == "vectorOverlay") {
				this.drawVectorOverlay(vis.summaryData[objId]);
				continue;
			}
			if (vis.summaryVisualizationMode == "positionOverlay") {
				this.drawPositionOverlay(vis.summaryData[objId]);
				continue;
			}
		}
	}
}

Visualization.prototype.getVis = function(currentTurn, name, onlyCurrentTurn) {

	if (this.elements.length == 0)
		return false;

	if (this.elements[currentTurn] !== undefined && this.elements[currentTurn][name] !== undefined) {
		return this.elements[currentTurn][name];
	}

	if (!onlyCurrentTurn) {
		for (let i = currentTurn - 1; i >= 0; --i) {
			if (this.elements[i] !== undefined && this.elements[i][name] !== undefined) {
				return this.elements[i][name];
			}
		}
	}
	return false;
}

Visualization.prototype.drawDetailed = function(turn, step, names)
{
}

Visualization.prototype.drawGridOverlay = function(overlay)
{
	if (!overlay)
		return;

	let borderPixel = 1;
	let cellWidth = this.canvas.width / this.coordSpace.maxWidth;
	let cellHeight = this.canvas.height / this.coordSpace.maxHeight;

	for ([nodeId, nodeType] of overlay.nodes) {
		// draw cell
		let iTrans = this.coordSpace.maxHeight - Math.floor(nodeId / this.coordSpace.maxWidth) - 1; // adjust to different coordinate system
		let j = nodeId % this.coordSpace.maxWidth
	
		colors = [ "#00FF0080", "#FF000080", "#0000FF80" ]
		this.ctx.fillStyle = colors[nodeType];
		
		if (nodeType > 2)
			alert("invalid node type of " + nodeType + "!");
	
		this.ctx.fillRect(j * cellWidth + borderPixel, 	// startX
			iTrans * cellHeight + borderPixel, // startY
			cellWidth - 2 * borderPixel,	// width
			cellHeight - 2 * borderPixel 	// height
		);
	}

	if (overlay.nodeTexts === undefined)
		return;

	for ([nodeId, text] of overlay.nodeTexts) {

		this.ctx.fillStyle = "black";
		this.ctx.font = "8px Arial";
		// adjust to different coordinate system. Substract 0.5 to roughly get the text centered in the cell.
		let iTrans = this.coordSpace.maxHeight - Math.floor(nodeId / this.coordSpace.maxWidth) - 0.5;
		let j = nodeId % this.coordSpace.maxWidth;
		this.ctx.fillText(text, j * cellWidth + borderPixel, iTrans * cellHeight + borderPixel);
	}
}

Visualization.prototype.drawVectorOverlay = function(overlay)
{
	let pos = new Vector2D(overlay.startPoint.x, overlay.startPoint.y);
	// adjust to different coordinate system
	pos.set(this.canvas.width / this.coordSpace.maxWidth * pos.x,
		this.canvas.height - (this.canvas.height / this.coordSpace.maxHeight * pos.y));

	this.ctx.strokeStyle = "#ffd200"; // yellow
	this.ctx.lineWidth = 4;

	for (let vec of overlay.vectors) {
		
		this.ctx.beginPath();
		this.ctx.moveTo(pos.x, pos.y);
		vecConv = new Vector2D(this.canvas.width / this.coordSpace.maxWidth * vec.x,
			this.canvas.height / this.coordSpace.maxHeight * vec.y * -1);
		pos.add(vecConv);
		this.ctx.lineTo(pos.x, pos.y);
		this.ctx.stroke();
		this.ctx.closePath();
	}
}

Visualization.prototype.drawPositionOverlay = function(overlay)
{
	this.ctx.strokeStyle = "#ff0000"; // red
	this.ctx.lineWidth = 2;
	let crossWidth = 12;

	for (let i = 0; i < overlay.points.length; ++i) {
		let pos = Vector2D.clone(overlay.points[i]);
		// adjust to different coordinate system
		pos.set(this.canvas.width / this.coordSpace.maxWidth * pos.x, this.canvas.height - (this.canvas.height / this.coordSpace.maxHeight * pos.y));

		this.ctx.beginPath();
		this.ctx.moveTo(pos.x - crossWidth / 2, pos.y);
		this.ctx.lineTo(pos.x + crossWidth / 2, pos.y);
		this.ctx.moveTo(pos.x, pos.y - crossWidth / 2);
		this.ctx.lineTo(pos.x, pos.y + crossWidth / 2);
		this.ctx.stroke();
		this.ctx.closePath();
	}
}
