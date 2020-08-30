import Entity from "./Entity";
import Units from "../Units";

export default class Ship extends Entity
{
	constructor(world, options)
	{
		super(world, options);
	}
	
	initPhysics(options)
	{
		this.b2BodyDef = new Box2D.b2BodyDef();
		this.b2BodyDef.set_type( Box2D.b2_dynamicBody );
		
		this.b2Body	= this.world.b2World.CreateBody(this.b2BodyDef);
		this.b2Body.SetAngularDamping(options.angularDamping);
		
		super.initPhysics(options);
		
		var radius	= options.radius * Units.GRAPHICS_TO_PHYSICS;
		var shape	= new Box2D.b2PolygonShape();
		
		shape.SetAsBox(radius, radius);
		
		var fixtureDef = new Box2D.b2FixtureDef();
		fixtureDef.set_density(options.density);
		fixtureDef.set_friction(options.friction);
		fixtureDef.set_restitution(options.restitution);
		fixtureDef.set_shape(shape);
		
		this.b2Body.CreateFixture(fixtureDef);
	}
	
	initGraphics(options)
	{
		var radius = options.radius;
	
		var geometry = new THREE.BoxGeometry(radius * 2, radius * 2, radius * 2);
		var material = new THREE.MeshBasicMaterial({color: 0xff0000});
		
		this.object3d = new THREE.Mesh(geometry, material);
	}
}