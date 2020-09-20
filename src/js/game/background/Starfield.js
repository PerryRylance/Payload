export default class Starfield
{
	constructor(game)
	{
		this.game		= game;
		
		this.layers		= [];
		this.object3d	= new THREE.Group();
		
		this.initLayers();
	}
	
	initLayers()
	{
		for(let index = 0; index < 3; index++)
		{
			let points;
			let vertices = [];
			let geometry = new THREE.BufferGeometry();
			
			//  { size: size, map: sprite, blending: THREE.AdditiveBlending, depthTest: false, transparent: true } 
			
			let material = new THREE.PointsMaterial({
				size: 16 + Math.random() * 16,
				map: payload.assets.sprites.stars.random(this.game).resource,
				blending: THREE.AdditiveBlending,
				// depthTest: false,
				transparent: true
			});
			
			for(var count = 0; count < 5000; count++)
			{
				let a = Math.random() * 2 * Math.PI;
				let r = 35000 * Math.sqrt(Math.random());
				
				vertices.push(
					Math.sin(a) * r,
					Math.cos(a) * r,
					0
				);
			}
			
			geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
			
			points = new THREE.Points(geometry, material);
			
			this.layers.push(points);
			this.object3d.add(points);
		}
	}
	
	update()
	{
		let camera		= this.game.world.camera;
		
		for(let i = 0; i < this.layers.length; i++)
		{
			let layer	= this.layers[i];
			let scale	= 1 / (i + 2);
			
			layer.position.set(
				camera.position.x * scale,
				camera.position.y * scale,
				0
			);
		}
		
		this.object3d.position.set(0, 0, -100);
		
		//let scale		= 1 / (camera.zoom / 2);
		//this.object3d.scale.set(scale, scale, 1);
	}
}