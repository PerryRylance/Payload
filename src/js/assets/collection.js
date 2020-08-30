import Asset from "./Asset";

export default class Collection
{
	constructor(json)
	{
		Payload.assert(typeof json == "object");
		
		this.assets = {};
		
		for(var name in json)
		{
			var child = json[name];
			
			if(Collection.isAssetDefinition(child))
				this.assets[name] = new Asset(child);
			else
				this[name] = new Collection(child);
		}
	}
	
	static isAssetDefinition(obj)
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
	
	random(game)
	{
		var arr		= Object.values(this.assets);
		var index	= Math.floor( game.random() * arr.length );
		
		return arr[index];
	}
}