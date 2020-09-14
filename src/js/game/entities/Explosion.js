import Emitter from "./particles/Emitter";
import AnimatedParticleGeometry from "./particles/AnimatedParticleGeometry";
import Units from "../Units";

export default class Explosion extends Emitter
{
	constructor(world, options)
	{
		let scale	= 2;
		let cells	= new THREE.Vector2(5, 5);
		let frames	= 23;
		
		super(world, $.extend(true, options, {
			radius:				50,
			maxParticleCount:	23,
			life:				23 * 2,
			fadeOverTime:		false,
			spawnRate:			0,
			spawnInitial:		23,
			callbacks: {
				position:		function() { return new THREE.Vector3(scale * 0.5 * (Math.random() - 0.5), scale * 0.5 * (Math.random() - 0.5), 0); },
				rotation:		function() { return Math.random() * 2 * Math.PI },
				velocity:		function() { return new THREE.Vector3(scale * 2 * (Math.random() - 0.5), scale * 2 * (Math.random() - 0.5), 0); }
			}
		}));
		
		this.geometry = new AnimatedParticleGeometry(80 * scale, cells, frames);
		
		this.material = new THREE.MeshBasicMaterial({
			depthWrite:		false,
			transparent:	true,
			blending:		THREE.AdditiveBlending,
			map:			payload.assets.sprites.assets["explosion.png"].resource
		});
	}
	
	initPhysics(options)
	{
		Payload.assert(!isNaN(options.radius));
		
		let radius		= options.radius * Units;
		let circleShape	= new Box2D.b2CircleShape();
		let fixtureDef	= new Box2D.b2FixtureDef();
		
		circleShape.set_m_radius(radius * Units.GRAPHICS_TO_PHYSICS);
		
		fixtureDef.set_shape( circleShape );
		
		let bodyDef		= new Box2D.b2BodyDef();
		
		// NB: This could be kinematic, no?
		bodyDef.set_type(Box2D.b2_dynamicBody);
		
		this.b2Body		= this.world.b2World.CreateBody(this.b2BodyDef);
		this.b2Body.CreateFixture( fixtureDef );
		
		super.initPhysics(options);
	}
	
	initGraphics(options)
	{
		super.initGraphics(options);
		
		this.zIndex = 200;
	}
}

// NB: Hack whilst I figure out how to reference this class in Entity
jQuery(function($) {
	Payload.Explosion = Explosion;
});