// requires: assets/assets.js

/**
 * @module Payload.Collection
 * Loads all assetse ready for use before the game starts
 */

Payload.Assets.Collection = function(json)
{
	this.assets = {};
	
	function isAssetDefinition(obj)
	{
		var index = 0;
		
		if(typeof obj == "string")
			return true;
		
		for(var name in obj)
		{
			if(typeof obj[name] != "string")
				return false;
			
			if(++index > 1)
				return false;
		}
	}
	
	for(var name in json)
	{
		var child = json[name];
		
		if(isAssetDefinition(child))
			this.assets[name] = new Payload.Assets.Asset(child);
		else
			this[name] = new Payload.Assets.Collection(child);
	}
}

Payload.Assets.Collection.prototype.random = function()
{
	var arr		= Object.values(this.assets);
	var index	= Math.floor( Math.random() * arr.length );
	
	return arr[index];
}