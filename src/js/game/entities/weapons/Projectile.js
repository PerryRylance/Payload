import Entity from "../Entity";
import Units from "../../Units";

export default class Projectile extends Entity
{
	constructor(world, options)
	{
		super(world, options);
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