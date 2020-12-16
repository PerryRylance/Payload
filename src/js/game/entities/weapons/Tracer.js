import Projectile from "./Projectile";

export default class Tracer extends Projectile
{
	constructor(world, options)
	{
		if(!options)
			options = {};
		
		options.smokeless	= true;
		options.silent		= true;
		
		super(world, options);
		
		this.points	= [];
		this.state	= Tracer.STATE_INITIAL;
		
		this.age	= 0;
		
		this.once("collision", event => {
			
			this.updateLine();
			
			this.state = Tracer.STATE_COMPLETED;
			
			this.world.b2World.DestroyBody(this.b2Body);
			this.b2Body = null;
			
			this.trigger("completed");
			
		});
	}
	
	initGraphics(options)
	{
		let color = 0xff0000;
		
		if(options.color)
			color = options.color;
		
		this.object3d	= new THREE.Object3D();
		this.material	= new THREE.LineDashedMaterial({
			color: color,
			linewidth: 1,
			scale: 1,
			dashSize: 100,
			gapSize: 100,
		});
	}
	
	launch(options)
	{
		super.launch(options);
		
		this.state	= Tracer.STATE_RECORDING;
	}
	
	update()
	{
		super.update();
		
		if(!this.object3d)
			return;
		
		this.object3d.position.set(0, 0, 0);
		
		if(this.state != Tracer.STATE_RECORDING)
			return;
		
		this.points.push(new THREE.Vector3(
			this.position.x,
			this.position.y,
			0
		));
		
		if(++this.age % 60 == 0)
			this.updateLine();
	}
	
	updateLine()
	{
		// return;
		
		if(this.line && this.geometry)
		{
			this.object3d.remove(this.line);
			this.geometry.dispose();
		}
		
		this.geometry = new THREE.BufferGeometry().setFromPoints(this.points);
		
		this.geometry.lineDistancesNeedUpdate = true;
		
		this.line = new THREE.Line(this.geometry, this.material);
		
		this.object3d.add(this.line);
	}
	
	remove()
	{
		super.remove();
		
		if(this.geometry)
			this.geometry.dispose();
	}
}

Tracer.STATE_INITIAL		= "initial";
Tracer.STATE_RECORDING		= "recording";
Tracer.STATE_COMPLETED		= "completed";