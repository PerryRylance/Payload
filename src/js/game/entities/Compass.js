import Entity from "./Entity";

export default class Compass extends Entity
{
	constructor(world, options)
	{
		super(world, options);
	}
	
	initGraphics()
	{
		let radius	= this.world.options.ship.radius * 16;
		
		this.object3d			= new THREE.Object3D();
			
		this.outer				= {
			geom:				new THREE.PlaneGeometry(radius, radius),
			material:			new THREE.MeshBasicMaterial({
				map:			payload.assets.sprites.compass.assets["outer.png"].resource,
				transparent:	true
			})
		};
		
		this.inner				= {
			geom:				new THREE.PlaneGeometry(radius * 0.7, radius * 0.7),
			material:			new THREE.MeshBasicMaterial({
				map:			payload.assets.sprites.compass.inner.random(this.world.game).resource,
				transparent:	true
			})
		};
		
		this.outer.mesh		= new THREE.Mesh(this.outer.geom, this.outer.material);
		this.inner.mesh		= new THREE.Mesh(this.inner.geom, this.inner.material);
		
		this.object3d.add(this.outer.mesh);
		this.object3d.add(this.inner.mesh);
		
		this.innerAngularVelocity = 0;
		this.innerRemainingFrames = 0;
	}
	
	update()
	{
		let player		= this.world.game.currentPlayer;
		
		if(--this.innerRemainingFrames <= 0)
		{
			this.innerAngularVelocity = (Math.random() - 0.5) * 2 * Math.PI / 100;
			this.innerRemainingFrames = 30 + Math.random() * 300;
		}
		
		this.inner.mesh.rotation.z += this.innerAngularVelocity;
		
		if(player)
			this.object3d.position.copy(player.ship.object3d.position);
		
		super.update();
	}
}