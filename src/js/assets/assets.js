// requires: events/event-dispatcher.js

/**
 * @module Payload.Assets
 * Loads all assetse ready for use before the game starts
 */
Payload.Assets = function()
{
	var self = this;
	
	Payload.EventDispatcher.call(this);
	
	this.collections = [];
	
	this.manager = new THREE.LoadingManager();
	this.manager.onStart = function(url, loaded, total) {
		self.onProgress(url, loaded, total);
	};
	this.manager.onProgress = function(url, loaded, total) {
		self.onProgress(url, loaded, total);
	};
	this.manager.onLoad = function() {
		self.onLoad();
	};
	this.manager.onError = function(url) {
		self.onError(url);
	}
}

Payload.extend(Payload.Assets, Payload.EventDispatcher);

Payload.Assets.prototype.load = function()
{
	var self = this;
	
	$.ajax("assets.json", {
		
		success: function(response, status, xhr) {
			self.loadFromJSON(response);
		},
		
		error: function(xhr, status, error) {
			throw new Error("Error loading assets file");
		}
		
	});
}

Payload.Assets.prototype.loadFromJSON = function(json)
{
	Payload.assert(typeof json == "object", "Invalid assets file");
	
	// NB: Get around a quirk of the directory map gulp plugin
	json = json[""];
	
	for(var name in json)
	{
		this[name] = new Payload.Assets.Collection(json[name]);
	}
}

Payload.Assets.prototype.onProgress = function(url, loaded, total)
{
	this.trigger({
		type:		"progress",
		amount:		loaded / total,
		percent:	(loaded / total) * 100
	});
}

Payload.Assets.prototype.onError = function(url, loaded, total)
{
	throw new Error("Failed to load asset");
}

Payload.Assets.prototype.onLoad = function()
{
	this.trigger("load");
}