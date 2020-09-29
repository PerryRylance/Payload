import Entity from "../Entity";
import Units from "../../Units";
import Sound from "../Sound";

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