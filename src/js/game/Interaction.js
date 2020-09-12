import CameraControls from "camera-controls";
import {Interaction as Dispatcher} from 'three.interaction';

export default class Interaction
{
	constructor(world, element)
	{
		var self = this;
		
		this.camera		= world.camera;
		this.element	= element;
		
		this.clock		= new THREE.Clock();
		this.controls	= new CameraControls(this.camera, element);
		
		this.controls.mouseButtons.left = CameraControls.ACTION.TRUCK;
		this.controls.mouseButtons.right = CameraControls.ACTION.NONE;
		this.controls.mouseButtons.wheel = CameraControls.ACTION.ZOOM;	// NB: We will implement this ourselves
		
		this.controls.zoomToCursor = true;
		
		this.dispatcher	= new Dispatcher(world.renderer, world.scene, world.camera);
	}
	
	update()
	{
		var delta		= this.clock.getDelta();
	
		this.controls.update(delta);
	}
}