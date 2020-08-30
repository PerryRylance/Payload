import EventDispatcher from "@perry-rylance/event-dispatcher";
import Collection from "./Collection";

export default class Assets extends EventDispatcher
{
	constructor()
	{
		super();
		
		this.collections = [];
		
		this.manager = new THREE.LoadingManager();
		
		this.manager.onStart = 
			this.manager.onProgress = 
			(url, loaded, total) => this.onProgress(url, loaded, total)
		
		this.manager.onLoad = () => this.onLoad();
		
		this.manager.onError = (url) => this.onError(url);
	}
	
	load()
	{
		var self = this;
		
		$.ajax("assets.json", {
			success: (response, status, xhr) => this.loadFromJSON(response),
			error: (xhr, status, error) => {
				throw new Error("Error loading assets file");
			}
		});
	}
	
	loadFromJSON(json)
	{
		Payload.assert(typeof json == "object", "Invalid assets file");
		
		// NB: Get around a quirk of the directory map gulp plugin
		json = json[""];
		
		for(var name in json)
		{
			this[name] = new Collection(json[name]);
		}
	}
	
	onProgress(url, loaded, total)
	{
		this.trigger({
			type:		"progress",
			amount:		loaded / total,
			percent:	(loaded / total) * 100
		});
	}
	
	onError(url, loaded, total)
	{
		throw new Error("Failed to load asset");
	}
	
	onLoad()
	{
		this.trigger("load");
	}
}