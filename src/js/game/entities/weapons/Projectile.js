import Entity from "../Entity";
import Units from "../../Units";
import Sound from "../Sound";
import Emitter from "../particles/Emitter";

export default class Projectile extends Entity
{
	constructor(world, options)
	{
		super(world, options);
		
		if(!options || !options.silent)
		{
			let sound = new Sound(this.world, {
				asset: payload.assets.sounds.assets["458669__jorgerosa__missile-launch.mp3"]
			});
			this.world.add(sound);
		}
		
		if(!options || !options.smokeless)
		{
			/*this.emitter = new Emitter(this.world, {
				
				geometry:	new THREE.PlaneGeometry(20, 20),
				material:	new THREE.MeshBasicMaterial({
					map:			payload.assets.sprites.assets["smokeparticle.png"].resource,
					depthWrite:		false,
					// transparent:	true
				}),
				
				maxParticleCount:	60,
				life:				Infinity,
				spawnRate:			60 / 300,
				spawnInitial:		0,
				
				fadeOverTime:		true,
				
				callbacks: {
					rotation:		function() { return Math.random() * 2 * Math.PI; },
					velocity:		function() { return new THREE.Vector3(0, 0, 0); }
				}
				
			});
			
			this.world.add(this.emitter);
			this.emitter.attachTo(this);
			
			this.once("removed", event => {
				// this.emitter.life = 300;
				this.emitter.spawnRate = 0;
			});*/
		}
	}
	
	static get b2Filter()
	{
		if(Projectile._b2Filter)
			return Projectile._b2Filter;
		
		Projectile._b2Filter = new Box2D.b2Filter();
		Projectile._b2Filter.set_groupIndex(-1);
		
		return Projectile._b2Filter;
	}
	
	initPhysics(options)
	{
		let radius = this.world.options.projectile.radius * Units.GRAPHICS_TO_PHYSICS;
		
		var circleShape = new Box2D.b2CircleShape();
		circleShape.set_m_radius( radius );
		
		var fixtureDef = new Box2D.b2FixtureDef();
		fixtureDef.set_density( 2.5 );
		fixtureDef.set_friction( 0.6 );
		fixtureDef.set_shape( circleShape );
		fixtureDef.set_isSensor( true );
		
		// NB: Prevent projectiles colliding with one another
		fixtureDef.set_filter(Projectile.b2Filter);
		
		this.b2BodyDef = new Box2D.b2BodyDef();
		this.b2BodyDef.set_type( Box2D.b2_dynamicBody );
		
		this.b2Body = this.world.b2World.CreateBody(this.b2BodyDef);
		this.b2Body.CreateFixture( fixtureDef );
		
		super.initPhysics(options);
	}
	
	initGraphics(options)
	{
		let radius = this.world.options.projectile.radius;
		
		// NB: Temporary
		this.object3d = new THREE.Mesh(
			new THREE.SphereGeometry(radius),
			new THREE.MeshBasicMaterial({
				color: 0xff0000
			})
		);
	}
	
	
}