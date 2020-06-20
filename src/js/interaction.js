// requires: core.js

Payload.Interaction = function(camera, element)
{
	var self = this;
	
	this.camera		= camera;
	this.element	= element;
	
	this.isDragging = false;
	
	element.addEventListener("mousedown", function(event) {
		self.onMouseDown(event);
	});
	
	element.addEventListener("mouseup", function(event) {
		self.onMouseUp(event);
	});
	
	element.addEventListener("mousemove", function(event) {
		self.onMouseMove(event);
	});
	
	element.addEventListener("mousewheel", function(event) {
		self.onMouseWheel(event);
	});
}

Payload.Interaction.prototype.onMouseDown = function(event)
{
	this.isDragging = true;
}

Payload.Interaction.prototype.onMouseUp = function(event)
{
	this.isDragging = false;
}

Payload.Interaction.prototype.onMouseMove = function(event)
{
	if(!this.isDragging)
		return;
	
	this.camera.position.x -= event.movementX / this.camera.zoom;
	this.camera.position.y -= event.movementY / this.camera.zoom;
}

Payload.Interaction.prototype.onMouseWheel = function(event)
{	
	var amount		= event.deltaY < 0 ? 1 : -1;
	var factor		= this.camera.zoom * 0.1;
	
	// TODO: Center on mouse point, apply zoom, recenter on old camera center
	
	this.camera.zoom += amount * factor;
	this.camera.updateProjectionMatrix();
}