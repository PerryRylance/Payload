import Starfield from "./Starfield";

export default class Background
{
	constructor(game, scene)
	{
		this.starfield = new Starfield(game);
		
		this.object3d = new THREE.Group();
		this.object3d.add(this.starfield.object3d);
		
		scene.add(this.object3d);
	}
	
	update()
	{
		this.starfield.update();
	}
}