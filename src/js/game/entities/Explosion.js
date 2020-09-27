import Emitter from "./particles/Emitter";
import AnimatedParticleGeometry from "./particles/AnimatedParticleGeometry";
import Units from "../Units";
import Planet from "./Planet";
import Ship from "./Ship";

export default class Explosion extends Emitter
{
	constructor(world, options)
	{
		let scale	= (options.radius ? options.radius / 25 : 1);
		let cells	= new THREE.Vector2(5, 5);
		let frames	= 23;
		
		super(world, $.extend(true, {
			radius:				50,
			maxParticleCount:	23,
			life:				23 * 2,
			fadeOverTime:		false,
			spawnRate:			0,
			spawnInitial:		23,
			callbacks: {
				position:		function() { return new THREE.Vector3(
					scale * 0.5 * (Math.random() - 0.5), 
					scale * 0.5 * (Math.random() - 0.5), 
					0);
				},
				rotation:		function() { 
					return Math.random() * 2 * Math.PI 
				},
				velocity:		function() { return new THREE.Vector3(
					scale * 2 * (Math.random() - 0.5), 
					scale * 2 * (Math.random() - 0.5), 0); 
				}
			}
		}, options));
		
		this.geometry = new AnimatedParticleGeometry(80 * scale, cells, frames);
		
		// TODO: This should be static
		this.material = new THREE.MeshBasicMaterial({
			depthWrite:		false,
			transparent:	true,
			blending:		THREE.AdditiveBlending,
			map:			payload.assets.sprites.assets["explosion.png"].resource
		});
		
		this._physicsQueryDone = false;
	}
	
	initAudio()
	{
		let size	= (this.radius <= 100 ? "small" : "large");
		let buffer	= payload.assets.sounds.explosions[size].random(this.world.game).resource;
		
		this.audio	= new THREE.Audio(this.world.listener)
		
		this.audio.setBuffer(buffer);
		this.audio.play();
	}
	
	applyPlanetDamage()
	{
		let callback = new Box2D.JSQueryCallback();
		
		callback.ReportFixture = function(fixturePtr)
		{
			let fixture	= Box2D.wrapPointer(fixturePtr, Box2D.b2Fixture);
			let body	= fixture.GetBody();
			let entity	= body.entity;
			
			// TODO: Check that at least one point is within range, because we are querying a square
			
			if(entity instanceof Planet)
				entity.applyFixtureDamage(fixture);
			
			return true;
		}
		
		let radius		= this.radius * Units.GRAPHICS_TO_PHYSICS;
		let aabb		= new Box2D.b2AABB();
		let position	= this.position;
		
		position.x		*= Units.GRAPHICS_TO_PHYSICS;
		position.y		*= Units.GRAPHICS_TO_PHYSICS;
		
		aabb.set_lowerBound(new Box2D.b2Vec2(position.x - radius, position.y - radius));
		aabb.set_upperBound(new Box2D.b2Vec2(position.x + radius, position.y + radius));
		
		this.world.b2World.QueryAABB(callback, aabb);
	}
	
	applyShipDamage()
	{
		let radius = this.radius * 2;
		
		var ships		= this.getEntitiesWithinRadius(radius, function(entity) {
			return entity instanceof Ship;
		});
		
		ships.forEach( ship => {
			
			let local	= this.position;
			let foreign	= ship.position;
			
			let delta	= {
				x: foreign.x - local.x,
				y: foreign.y - local.y
			};
			
			let length	= Math.sqrt(delta.x * delta.x + delta.y * delta.y);
			
			let factor		= 1 - (length / radius);
			
			let force		= radius // NB: For now, use the explosions radius to determine this
				* factor 
				* Units.GRAPHICS_TO_PHYSICS 
				* this.world.options.explosion.forceMultiplier;
				
			let normalized	= {
				x: delta.x / length,
				y: delta.y / length
			};
			
			let vec		= new Box2D.b2Vec2(
				normalized.x * force,
				normalized.y * force
			);
			
			ship.b2Body.SetAwake(1);
			ship.b2Body.ApplyLinearImpulse(vec);
			
			// NB: A damage falloff would be nice
			if(self.damage)
			{
				let damage	= Math.round(self.damage * factor);
				ship.damage(damage);
			}
			
		});
	}
	
	update()
	{
		let self = this;
		
		super.update();
		
		if(!this._physicsQueryDone)
		{
			this.applyPlanetDamage();
			this.applyShipDamage();
			
			this._physicsQueryDone = true;
		}
	}
}

// NB: Hack whilst I figure out how to reference this class in Entity
jQuery(function($) {
	Payload.Explosion = Explosion;
});