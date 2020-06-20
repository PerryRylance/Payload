/* requires: 
core.js
events/event-dispatcher.js
*/

/**
 * @module Payload.Entity
 * Base class for entities, which can optionally be audible, visible or phsyical
 */
Payload.Entity = function(world, options)
{
	Payload.assert(world instanceof Payload.World);
	
	Payload.EventDispatcher.call(this);
	
	this.world = world;
	
	this.initPhysics();
	this.initGraphics();
	this.initAudio();
	
	this.setOptions(options);
}

Payload.extend(Payload.Entity, Payload.EventDispatcher);

Object.defineProperty(Payload.Entity.prototype, "position", {
	
	"get": function()
	{
		if(this.b2Body)
		{
			var vec = this.b2Body.GetWorldCenter();
			
			return {
				x: vec.get_x() * Payload.Units.PHYSICS_TO_GRAPHICS,
				y: vec.get_y() * Payload.Units.PHYSICS_TO_GRAPHICS
			};
		}
		
		if(this.object3d)
		{
			return {
				x: this.object3d.position.x,
				y: this.object3d.position.y
			};
		}
		
		throw new Error("Entity has no body or object to get position from");
	},
	
	"set": function(position)
	{
		Payload.assert("x" in position && $.isNumeric(position.x));
		Payload.assert("y" in position && $.isNumeric(position.y));
		
		var x = position.x;
		var y = position.y;
		
		if(this.b2Body)
			this.b2Body.SetTransform(
				new Box2D.b2Vec2(
					x * Payload.Units.GRAPHICS_TO_PHYSICS, 
					y * Payload.Units.GRAPHICS_TO_PHYSICS),
				0
			);
			
		if(this.object3d)
			this.object3d.position.set(x, y, 0);
	}
	
});

Payload.Entity.prototype.initPhysics = function()
{
	
}

Payload.Entity.prototype.initGraphics = function()
{
	
}

Payload.Entity.prototype.initAudio = function()
{
	
}

Payload.Entity.prototype.setOptions = function(options)
{
	if(!options)
		return;
	
	if("position" in options)
		this.position = options.position;
}

Payload.Entity.prototype.update = function()
{
	if(this.b2Body && this.object3d)
	{
		var position	= this.b2Body.GetWorldCenter();
		var angle		= this.b2Body.GetAngle();
		
		var x			= position.get_x() * Payload.Units.PHYSICS_TO_GRAPHICS;
		var y			= position.get_y() * Payload.Units.PHYSICS_TO_GRAPHICS;
		
		this.object3d.position.set(x, y, 0);
		this.object3d.rotation.set(0, 0, angle);
	}
}

Payload.Entity.prototype.onCollision = function(entity, localFixture, otherFixture)
{
	
}

Payload.Entity.prototype.remove = function()
{
	if(this.b2Body)
	{
		this.world.b2World.DestroyBody(this.b2Body);
		this.b2Body = null;
	}
	
	if(this.object3d)
	{
		this.world.scene.remove(this.object3d);
		this.object3d = null;
	}
	
	this.world.remove(this);
	this.world = null;
}