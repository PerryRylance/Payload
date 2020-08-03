// requires: core.js

Payload.Interaction = function(camera, element)
{
	var self = this;
	
	this.camera		= camera;
	this.element	= element;
	
	this.clock		= new THREE.Clock();
	this.controls	= new CameraControls(camera, element);
	
	this.controls.mouseButtons.left = CameraControls.ACTION.TRUCK;
	this.controls.mouseButtons.right = CameraControls.ACTION.NONE;
	this.controls.mouseButtons.wheel = CameraControls.ACTION.ZOOM;
	
	this.controls.zoomToCursor = true;
}

Payload.Interaction.prototype.update = function()
{
	var delta		= this.clock.getDelta();
	
	this.controls.update(delta);
}