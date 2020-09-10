import Entity from "../Entity";
import AnimatedParticleGeometry from "./AnimatedParticleGeometry";

export default class Emitter extends Entity
{
	constructor(world, options)
	{
		var scale = 2;
		
		if(!Emitter.defaultGeometry)
			Emitter.defaultGeometry = new AnimatedParticleGeometry(80 * scale, new THREE.Vector2(5, 5), 23);
		
		if(!Emitter.defaultMaterial)
			Emitter.defaultMaterial = new THREE.MeshBasicMaterial({
				depthWrite:		false,
				transparent:	true,
				blending:		THREE.AdditiveBlending,
				map:			payload.assets.sprites.assets["explosion.png"].resource
			});
		
		var defaults = {
			
			geometry:			Emitter.defaultGeometry,
			material:			Emitter.defaultMaterial,
			
			maxParticleCount:	23,
			life:				23 * 2,
			
			fadeOverTime:		false,
			spawnRate:			0,
			spawnPoint:			new THREE.Vector3(0, 0, 0),
			spawnInitial:		23,
			
			callbacks: {
				position:		function() { return new THREE.Vector3(scale * 0.5 * (Math.random() - 0.5), scale * 0.5 * (Math.random() - 0.5), 0); },
				rotation:		function() { return Math.random() * 2 * Math.PI },
				scale:			function() { return new THREE.Vector3(1, 1, 1); },
				velocity:		function() { return new THREE.Vector3(scale * 2 * (Math.random() - 0.5), scale * 2 * (Math.random() - 0.5), 0); }
			}
			
		};
		
		if(!options)
			options = {};
		
		options = $.extend(true, defaults, options);
		
		super(world, options);
		
		this._particles = [];
		this._nextParticle = 0;
		this._attachment = null;
		this._spawnAccumulator = this.spawnInitial;
	}
	
	initGraphics()
	{
		this.object3d = new THREE.Object3D();
	}
	
	detach()
	{
		// TODO: Remove removal listener
	}
	
	attachTo(entity)
	{
		Payload.assert(entity instanceof Entity);
		
		this._attachment = entity;
		
		// TODO: Listen for removal, detach and remove self on removal
	}
	
	spawn()
	{
		let particle;
		let index = this._nextParticle++;
		this._nextParticle %= this.maxParticleCount;
		
		if(this._particles[index])
		{
			particle = this._particles[index];
			particle.visible = true;
		}
		else
		{
			particle = new THREE.Mesh(
				this.geometry.clone(),
				this.material.clone()
			);
			
			this._particles.push(particle);
			this.object3d.add(particle);
		}
		
		particle.age = 0;
		
		
		particle.position.copy(this.callbacks.position());
		particle.position.add(this.spawnPoint);
		
		particle.scale.copy(this.callbacks.scale());
		
		particle.rotation.z = this.callbacks.rotation();
		particle.velocity = this.callbacks.velocity();
	}
	
	updateParticle(particle)
	{
		if(this.fadeOverTime)
			particle.material.opacity = 1 - (particle.age / this.life);
		
		particle.position.add(particle.velocity);
		particle.age++;
		
		if(particle.geometry instanceof AnimatedParticleGeometry)
			particle.geometry.frame = Math.floor(particle.age / 2);	// NB: 30fps
	}
	
	update()
	{
		let i, spawnCount;
		
		if(this._attachment)
			this.spawnPoint.copy(this._attachment.object3d.position);
		
		super.update();
		
		if(--this.life <= 0)
		{
			this.remove();
			return;
		}
		
		this._spawnAccumulator += this.spawnRate;
		
		if((spawnCount = Math.floor(this._spawnAccumulator)) > 0)
		{
			this._spawnAccumulator -= spawnCount;
			
			for(i = 0; i < spawnCount; i++)
				this.spawn();
		}
		
		for(i = 0; i < this._particles.length; i++)
			this.updateParticle(this._particles[i]);
		
		
	}
}
