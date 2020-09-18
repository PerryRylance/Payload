import EventDispatcherWithOptions from "../../EventDispatcherWithOptions";
import Units from "../Units";
import World from "../World";

// import Emitter from "./particles/Emitter";
// import Explosion from "./Explosion";

export default class Entity extends EventDispatcherWithOptions
{
	constructor(world, options)
	{
		Payload.assert(world instanceof World);
		
		super(options);
		
		this._collisionEventQueue = [];
		
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
	
	get angle()
	{
		if(!this.isIsometric)
			return this.object3d.rotation.z;
		else
			return this._isometricContainer.rotation.z;
	}
	
	set angle(value)
	{
		Payload.assert(!isNaN(value));
		
		this._setAngle(value);
	}
	
	get isAffectedByGravity()
	{
		if(!this.b2Body)
			return false;
		
		return true;
	}
	
	get isIsometric()
	{
		return this._isIsometric;
	}
	
	getScreenCoordinates()
	{
		Payload.assert("object3d" in this);
		
		let size		= new THREE.Vector2();
		let pos			= new THREE.Vector3();
		
		this.world.renderer.getSize(size);
		
		pos				= pos.setFromMatrixPosition(this.object3d.matrixWorld);
		pos.project(this.world.camera);
		
		let widthHalf	= size.x / 2;
		let heightHalf	= size.y / 2;
		
		return new THREE.Vector2(
			(pos.x * widthHalf) + widthHalf,
			-(pos.y * heightHalf) + heightHalf
		);
	}
	
	initPhysics(options)
	{
		if(this.b2Body)
		{
			this.b2Body.entity = this;
			
			if(options && options.position)
				this.position = options.position;
		}
	}
	
	initGraphics(options)
	{
		this._isIsometric = false;
		
		// NB: Physics will take care of positioning, if we don't have a physical body, then set position here
		if(!this.b2Body && options && options.position)
			this.position = options.position;
	}
	
	initAudio()
	{
		
	}
	
	_makeIsometric(target)
	{
		Payload.assert(!this.isIsometric);
		
		let bbox = new THREE.Box3();
		
		this._isIsometric			= true;
		
		bbox.setFromObject(target);
		
		this._isometricContainer	= new THREE.Object3D();
		this._isometricContainer.rotation.set(-60 * Math.PI / 180, 0, 0);
		
		this._isometricContainer.add(target);
		
		return this._isometricContainer;
	}
	
	_setAngle(angle)
	{
		if(!this.isIsometric)
			this.object3d.rotation.z = angle;
		else
			this._isometricContainer.rotation.z = angle;
	}
	
	update()
	{
		while(this._collisionEventQueue.length > 0)
		{
			var event = this._collisionEventQueue.shift();
			this.trigger(event);
		}
		
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
	
	_onCollision(entity, localFixture, otherFixture)
	{
		this._collisionEventQueue.push({
			type:	"collision",
			entity:	entity
		});
	}
	
	remove()
	{
		if(this.b2Body)
		{
			if(!this.world.b2World.IsLocked())
				this.world.b2World.DestroyBody(this.b2Body);
			else
				this.world.bodyDestructionQueue.push(this.b2Body);
			
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
	
	launch(options)
	{
		let impulse;
		
		Payload.assert("b2Body" in this);
		
		if(!options)
			options = {
				degrees:	Math.random() * 360,
				power:		100
			};
		
		Payload.assert((options.degrees || options.impulse ? true : false));
		
		if(options.impulse)
		{
			Payload.assert(options.impulse instanceof THREE.Vector2);
			
			impulse = options.impulse;
		}
		else
		{
			Payload.assert(!isNaN(options.degrees));
			Payload.assert(!isNaN(options.power));
			
			impulse = new THREE.Vector2(
				options.power * Math.cos(options.degrees * Math.PI / 180),
				options.power * Math.sin(options.degrees * Math.PI / 180)
			);
		}
		
		// Convert the impulse
		impulse = new Box2D.b2Vec2(
			impulse.x * Units.GRAPHICS_TO_PHYSICS,
			impulse.y * Units.GRAPHICS_TO_PHYSICS
		);
		
		this.b2Body.SetAwake(1);
		this.b2Body.ApplyLinearImpulse(impulse, this.b2Body.GetWorldCenter());
	}
	
	explode(options)
	{
		if(!options)
			options = {};
		
		var explosion = new Payload.Explosion(this.world, $.extend(true, options, {
			position: this.position
		}));
		
		this.world.add(explosion);
		
		this.remove();
	}
}