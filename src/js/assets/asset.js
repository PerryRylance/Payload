// requires: assets/assets.js

Payload.Assets.Asset = function(src)
{
	var self		= this;
	var constructor	= this.getLoaderFromFilename(src);
	
	this.loader		= new constructor(payload.assets.manager);
		
	this.loader.load("/assets" + src, function(resource) {
		self.resource = resource;
	});
}

Payload.Assets.Asset.prototype.getLoaderFromFilename = function(filename)
{
	var m = /\.[a-z0-9]+$/i.exec(filename);
	
	if(!m || !m[0])
		throw new Error("Don't know how to load asset");
	
	switch(m[0].toLowerCase())
	{
		case ".png":
		case ".jpg":
		case ".jpeg":
		
			return THREE.TextureLoader;
		
			break;
	}
}