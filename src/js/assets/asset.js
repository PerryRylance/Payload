export default class Asset
{
	constructor(src)
	{
		var constructor	= Asset.getLoaderFromFilename(src);
	
		this.resource	= null;
		this.loader		= new constructor(payload.assets.manager);
		
		this.loader.load("/assets" + src, (resource) => {
			
			this.resource = resource;
			
			if(this.loader instanceof THREE.MTLLoader)
				resource.preload();
			
		});
		
	}
	
	static getLoaderFromFilename(filename)
	{
		var m = /\.[a-z0-9]+$/i.exec(filename);
		
		if(!m || !m[0])
			throw new Error("Cannot identify asset extension");
		
		switch(m[0].toLowerCase())
		{
			case ".png":
			case ".jpg":
			case ".jpeg":
			
				return THREE.TextureLoader;
			
				break;
			
			case ".mtl":
				
				return THREE.MTLLoader;
				
				break;
			
			case ".obj":
			
				return THREE.OBJLoader;
			
				break;
			
			case ".wav":
			case ".ogg":
			case ".mp3":
			
				return THREE.AudioLoader;
				
				return;
			
			default:
				
				throw new Error("Don't know how to load asset");
			
				break;
		}
	}
	
	getGeometries()
	{
		let results = [];
		
		this.resource.traverse( (child) => {
			
			if(child instanceof THREE.Mesh)
				results.push(child.geometry);
			
		} );
		
		return results;
	}
	
	getMaterials()
	{
		return this.resource.materials;
	}
}