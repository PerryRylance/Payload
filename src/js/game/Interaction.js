import CameraControls from "camera-controls";

export default class Interaction
{
	constructor(camera, element)
	{
		var self = this;
		
		this.camera		= camera;
		this.element	= element;
		
		this.clock		= new THREE.Clock();
		this.controls	= new CameraControls(camera, element);
		
		this.controls.mouseButtons.left = CameraControls.ACTION.TRUCK;
		this.controls.mouseButtons.right = CameraControls.ACTION.NONE;
		this.controls.mouseButtons.wheel = CameraControls.ACTION.ZOOM;	// NB: We will implement this ourselves
		
		this.controls.zoomToCursor = true;
	}
	
	update()
	{
		var delta		= this.clock.getDelta();
	
		this.controls.update(delta);
	}
}