// requires: entities/entity.js

Payload.Ship = function(world, options)
{
	Payload.Entity.apply(this, arguments);
}

Payload.extend(Payload.Ship, Payload.Entity);

Payload.Ship.prototype.initPhysics = function(options)
{
	this.b2BodyDef = new Box2D.b2BodyDef();
	this.b2BodyDef.set_type( Box2D.b2_dynamicBody );
	
	this.b2Body	= this.world.b2World.CreateBody(this.b2BodyDef);
	this.b2Body.SetAngularDamping(options.angularDamping);
	
	Payload.Entity.prototype.initPhysics.call(this);
	
	var radius	= Payload.Units.g2p(options.radius);
	var shape	= new Box2D.b2PolygonShape();
	
	shape.SetAsBox(1, 1);
	
	var fixtureDef = new Box2D.b2FixtureDef();
	fixtureDef.set_density(options.density);
	fixtureDef.set_friction(options.friction);
	fixtureDef.set_restitution(options.restitution);
	fixtureDef.set_shape(shape);
	
	this.b2Body.CreateFixture(fixtureDef);
}

Payload.Ship.prototype.initGraphics = function(options)
{
	var radius = options.radius;
	
	var geometry = new THREE.BoxGeometry(radius * 2, radius * 2, radius * 2);
	var material = new THREE.MeshBasicMaterial({color: 0xff0000});
	
	this.object3d = new THREE.Mesh(geometry, material);
}