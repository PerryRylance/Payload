import Entity from "./Entity";

export default class Compass extends Entity
{
	constructor(world, options)
	{
		super(world, options);
	}
	
	initGraphics()
	{
		let radius	= this.world.options.ship.radius * 20;
		
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
		
		// Get object ready`
		this.object3d.add(this._makeIsometric(group));
		this.object3d.entity = this;
		
		// Interaction
		// TODO: Add touch support
		this.object3d.on("mousedown", (event) => this.onMouseDown(event));
		$(window).on("mouseup", (event) => this.onMouseUp(event));
		$(window).on("mousemove", (event) => this.onMouseMove(event));
		
		// Animation
		this.innerAngularVelocity = 0;
		this.innerRemainingFrames = 0;
		
		// Z Index
		this.zIndex = 110;
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
	
	onMouseDown(event)
	{
		this._isUserInteracting = true;
		this.world.interaction.controls.enabled = false;
	}
	
	onMouseUp(event)
	{
		this._isUserInteracting = false;
		this.world.interaction.controls.enabled = true;
	}
	
	onMouseMove(event)
	{
		if(!this._isUserInteracting)
			return;
		
		let player		= this.world.game.currentPlayer;
		
		if(!player)
			return;
		
		let screen		= player.ship.getScreenCoordinates();
		let mouse		= new THREE.Vector2(event.clientX, event.clientY);
		
		// First orientate the compass
		let delta		= new THREE.Vector2();
		
		delta.subVectors(mouse, screen);
		
		this.angle		= Math.atan2(-delta.y, delta.x / 2);
		
		// Now populate the UI field
		let degrees		= Math.atan2(-delta.y, delta.x) / Math.PI * 180;
		
		degrees			= (degrees + 360) % 360;
		degrees			= Math.round(degrees);
		
		$("input[name='degrees']").val(degrees);
	}
}