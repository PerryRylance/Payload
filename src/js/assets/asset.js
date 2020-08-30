export default class Asset
{
	constructor(src)
	{
		var constructor	= Asset.getLoaderFromFilename(src);
	
		this.resource	= null;
		this.loader		= new constructor(payload.assets.manager);
		
		this.loader.load("/assets" + src, (resource) => {
			this.resource = resource;
		})
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
			
			default:
				
				throw new Error("Don't know how to load asset");
			
				break;
		}
	}
}