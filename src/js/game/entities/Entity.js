import EventDispatcherWithOptions from "../../EventDispatcherWithOptions";
import Units from "../Units";
import World from "../World";

export default class Entity extends EventDispatcherWithOptions
{
	constructor(world, options)
	{
		Payload.assert(world instanceof World);
		
		super(options);
		
		this.world = world;
		this.zIndex = 0;
		
		this.initPhysics(options);
		this.initGraphics(options);
		this.initAudio(options);
	}
	
	get position()
	{
		if(this.b2Body)
		{
			var vec = this.b2Body.GetWorldCenter();
			
			return {
				x: vec.get_x() * Units.PHYSICS_TO_GRAPHICS,
				y: vec.get_y() * Units.PHYSICS_TO_GRAPHICS
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
	}
	
	set position(position)
	{
		Payload.assert("x" in position && $.isNumeric(position.x));
		Payload.assert("y" in position && $.isNumeric(position.y));
		
		var x = position.x;
		var y = position.y;
		
		if(this.b2Body)
			this.b2Body.SetTransform(
				new Box2D.b2Vec2(
					x * Units.GRAPHICS_TO_PHYSICS, 
					y * Units.GRAPHICS_TO_PHYSICS),
				0
			);
			
		if(this.object3d)
			this.object3d.position.set(x, y, 0);
	}
	
	get isAffectedByGravity()
	{
		if(!this.b2Body)
			return false;
		
		return true;
	}
	
	initPhysics()
	{
		if(this.b2Body)
			this.b2Body.entity = this;
	}
	
	initGraphics()
	{
		
	}
	
	initAudio()
	{
		
	}
	
	_setAngle(angle)
	{
		this.object3d.rotation.z = angle;
	}
	
	update()
	{
		if(this.b2Body && this.object3d)
		{
			var position	= this.b2Body.GetWorldCenter();
			var angle		= this.b2Body.GetAngle();
			
			var x			= position.get_x() * Units.PHYSICS_TO_GRAPHICS;
			var y			= position.get_y() * Units.PHYSICS_TO_GRAPHICS;
			
			try{
				Payload.assert(!isNaN(x));
				Payload.assert(!isNaN(y));
				Payload.assert(!isNaN(angle));
			}catch(e) {
				this.world.b2World.DestroyBody(this.b2Body);
				this.b2Body = null;
				
				console.warn("Box2D encountered a NaN value at step " + this.world.currentStep, this);
			}
			
			if(!isNaN(x) && !isNaN(y))
				this.object3d.position.set(x, y, this.zIndex);
			
			if(!isNaN(angle))
				this._setAngle(angle);
		}
	}
	
	onCollision(entity, localFixture, otherFixture)
	{
		this.trigger({
			type:	"collision",
			entity:	entity
		});
	}
	
	remove()
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
}