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

}

Visualization.prototype.reset = function()
{
	this.elements = [];
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
Visualization.prototype.drawSummary = function(turn, names, objIds)
{
	if (!this.elements[turn])
		return;

	for (name of names) {
		if (!this.elements[turn][name]) {
			// it's valid to call this function with one or more names that don't exist in this turn
			continue;
		}
		
		// validate valid visualization modes
		if (["gridOverlay", "vectorOverlay"].indexOf(this.elements[turn][name].summaryVisualizationMode) == -1) {
			alert("Unknown visualization mode: " + this.elements[turn][name][summaryVisualizationMode] + "!");
			continue;
		}

		for (objId of objIds) {
		
			if (this.elements[turn][name].summaryVisualizationMode == "gridOverlay") {
				this.drawGridOverlay(this.elements[turn][name].summaryData[objId]);
				continue;
			}
			if (this.elements[turn][name].summaryVisualizationMode == "vectorOverlay") {
				this.drawVectorOverlay(this.elements[turn][name].summaryData[objId]);
				continue;
			}
		}
	}
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
