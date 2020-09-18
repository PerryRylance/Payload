import Emitter from "./particles/Emitter";
import AnimatedParticleGeometry from "./particles/AnimatedParticleGeometry";
import Units from "../Units";
import Planet from "./Planet";

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
		
		this.material = new THREE.MeshBasicMaterial({
			depthWrite:		false,
			transparent:	true,
			blending:		THREE.AdditiveBlending,
			map:			payload.assets.sprites.assets["explosion.png"].resource
		});
		
		this._physicsQueryDone = false;
	}
	
	initGraphics(options)
	{
		super.initGraphics(options);
		
		// TODO: Remove debug code
		var geom		= new THREE.CircleGeometry(this.radius, 16);
		var material	= new THREE.MeshBasicMaterial({color: 0xff0000});
		var mesh		= new THREE.Mesh(geom, material);
		
		this.object3d.add(mesh);
		
		this.zIndex = 200;
	}
	
	update()
	{
		super.update();
		
		if(!this._physicsQueryDone)
		{
			var callback = new Box2D.JSQueryCallback();
			
			callback.ReportFixture = function(fixturePtr)
			{
				var fixture	= Box2D.wrapPointer(fixturePtr, Box2D.b2Fixture);
				var body	= fixture.GetBody();
				var entity	= body.entity;
				
				// TODO: Check that at least one point is within range, because we are querying a square
				
				if(entity instanceof Planet)
					entity.applyFixtureDamage(fixture);
				
				// TODO: Propel ships
				
				return true;
			}
			
			var halfRadius	= this.radius / 2 * Units.GRAPHICS_TO_PHYSICS;
			var aabb		= new Box2D.b2AABB();
			var position	= this.position;
			
			position.x		*= Units.GRAPHICS_TO_PHYSICS;
			position.y		*= Units.GRAPHICS_TO_PHYSICS;
			
			aabb.set_lowerBound(new Box2D.b2Vec2(position.x - halfRadius, position.y - halfRadius));
			aabb.set_upperBound(new Box2D.b2Vec2(position.x + halfRadius, position.y + halfRadius));
			
			this.world.b2World.QueryAABB(callback, aabb);
			
			this._physicsQueryDone = true;
		}
	}
}

// NB: Hack whilst I figure out how to reference this class in Entity
jQuery(function($) {
	Payload.Explosion = Explosion;
});