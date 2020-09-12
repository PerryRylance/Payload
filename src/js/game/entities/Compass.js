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
				transparent:	true,
				depthTest:		false,
				depthWrite:		false
			})
		};
		
		this.inner				= {
			geom:				new THREE.PlaneGeometry(radius * 0.7, radius * 0.7),
			material:			new THREE.MeshBasicMaterial({
				map:			payload.assets.sprites.compass.inner.random(this.world.game).resource,
				transparent:	true,
				depthTest:		false,
				depthWrite:		false
			})
		};
		
		this.outer.mesh		= new THREE.Mesh(this.outer.geom, this.outer.material);
		this.inner.mesh		= new THREE.Mesh(this.inner.geom, this.inner.material);
		
		let group = new THREE.Group();
		
		group.add(this.outer.mesh);
		group.add(this.inner.mesh);
		
		// Compensate for sprite rotation
		group.rotation.z = 45 * Math.PI / 180;
		
		this.object3d.add(this._makeIsometric(group));
		
		this.innerAngularVelocity = 0;
		this.innerRemainingFrames = 0;
		
		this.zIndex = 200;
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