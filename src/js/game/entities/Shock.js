import Emitter from "./particles/Emitter";
import Units from "../Units";
import Ship from "./Ship";
import Sound from "./Sound";

export default class Shock extends Emitter
{
	constructor(world, options)
	{
		let size = 384;
		
		super(world, $.extend(true, {
			fadeOverTime:		true,
			spawnRate:			0,
			spawnInitial:		32,
			maxParticleCount:	32,
			life:				30,
			callbacks: {
				rotation:		function() {
					return Math.random() * 2 * Math.PI;
				},
				velocity:		function() {
					return new THREE.Vector3(0, 0, 0)
				}
			}
		}, options));
		
		this.size		= size;
		this.geometry	= new THREE.PlaneGeometry(size, size);
		
		this.once("added", event => {
			
			let sound = new Sound(this.world, {
				asset: payload.assets.sounds.shocks.random(this.world.game)
			});
			this.world.add(sound);
			
		});
	}
	
	static get materials()
	{
		if(Shock._cachedMaterials)
			return Shock._cachedMaterials;
		
		Shock._cachedMaterials = [];
		
		let assets = payload.assets.sprites.lightning.assets;
		
		for(let key in assets)
		{
			let asset		= assets[key];
			
			let material	= new THREE.MeshBasicMaterial({
				depthWrite:		false,
				transparent:	true,
				blending:		THREE.AdditiveBlending,
				map:			asset.resource
			});
			
			Shock._cachedMaterials.push(material);
		}
		
		return Shock._cachedMaterials;
	}
	
	createParticle()
	{
		let object3d	= new THREE.Object3D();
		let geom		= this.geometry;
		let material	= this.getRandomMaterial();
		let mesh		= new THREE.Mesh(geom, material);
		
		mesh.position.y = -this.size / 2;
		
		object3d.material = material;
		object3d.add(mesh);
		
		// Keep a reference to the mesh so we can update it's material at runtime
		object3d.mesh = mesh;
		
		return object3d;
	}
	
	getRandomMaterial()
	{
		let material	= Shock.materials[ Math.floor(Math.random() * Shock.materials.length) ].clone();
		let rg			= Math.round(Math.random() * 100);
		let string		= "rgb(" + rg + "%, " + rg + "%, 100%)";
		let color		= new THREE.Color(string);
		
		material.color.setHex(color.getHex());
		
		return material;
	}
	
	applyShipDamage()
	{
		let radius = this.radius + this.world.options.ship.radius;
		var ships		= this.getEntitiesWithinRadius(radius, function(entity) {
			return entity instanceof Ship;
		});
		
		ships.forEach( ship => {
			
			ship.damage(this.damage);
			
		});
	}
	
	update()
	{
		for(var i = 0; i < this._particles.length; i++)
		{
			let particle = this._particles[i];
			let material = this.getRandomMaterial();
			
			particle.material = particle.mesh.material = material;
		}
		
		super.update();
		
		if(!this._physicsQueryDone)
		{
			this.applyShipDamage();
			
			this._physicsQueryDone = true;
		}
	}
}