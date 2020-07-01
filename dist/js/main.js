window.Payload = function()
{
	window.stats = new Stats();
	stats.showPanel(0);
	stats.domElement.style.zIndex = 999;
	stats.domElement.style.position = "fixed";
	document.body.appendChild(stats.domElement);
	
	window.Box2D = Box2D({
		TOTAL_MEMORY: Payload.BOX2D_MEMORY_MB * 1048576
	});
}

Payload.BOX2D_MEMORY_MB		= 256;

Payload.extend = function(child, parent)
{
	child.prototype = Object.create(parent.prototype);
	child.prototype.constructor = child;
}

Payload.assert = function(condition, failure)
{
	if(condition === true)
		return;
	
	if(condition === false)
	{
		if(!failure)
			throw new Error("Assertion failed");
		
		throw new Error(failure);
	}
	
	throw new Error("Invalid assertion");
}

Payload.prototype.init = function()
{
	var self = this;
	
	$("dialog.loading").attr("open", "open");
	
	this.assets = new Payload.Assets();
	this.assets.on("load", function(event) {
		
		$("dialog.loading").removeAttr("open");
		
		// Temp code, just start up a game here
		
		self.game = new Payload.Game();
		
	});
	this.assets.load();
}

// requires: core.js

/**
 * @module Payload.Game
 * Handles rules, turns, etc.
 */

Payload.Game = function()
{
	this.world = new Payload.World();
}

// requires: core.js

Payload.Interaction = function(camera, element)
{
	var self = this;
	
	this.camera		= camera;
	this.element	= element;
	
	this.isDragging = false;
	
	element.addEventListener("mousedown", function(event) {
		self.onMouseDown(event);
	});
	
	element.addEventListener("mouseup", function(event) {
		self.onMouseUp(event);
	});
	
	element.addEventListener("mousemove", function(event) {
		self.onMouseMove(event);
	});
	
	element.addEventListener("mousewheel", function(event) {
		self.onMouseWheel(event);
	});
}

Payload.Interaction.prototype.onMouseDown = function(event)
{
	this.isDragging = true;
}

Payload.Interaction.prototype.onMouseUp = function(event)
{
	this.isDragging = false;
}

Payload.Interaction.prototype.onMouseMove = function(event)
{
	if(!this.isDragging)
		return;
	
	this.camera.position.x -= event.movementX / this.camera.zoom;
	this.camera.position.y -= event.movementY / this.camera.zoom;
}

Payload.Interaction.prototype.onMouseWheel = function(event)
{	
	var amount		= event.deltaY < 0 ? 1 : -1;
	var factor		= this.camera.zoom * 0.1;
	
	// TODO: Center on mouse point, apply zoom, recenter on old camera center
	
	this.camera.zoom += amount * factor;
	this.camera.updateProjectionMatrix();
}
window.addEventListener("load", function(event) {

	window.payload = new Payload();
	payload.init();
	
});
// require: core.js

Payload.Units = {
	
	RATIO: 20,
	
	physicsToGraphics: function(x) {
		return x * Payload.Units.PHYSICS_TO_GRAPHICS;
	},
	
	graphicsToPhysics: function(x) {
		return x * Payload.Units.GRAPHICS_TO_PHYSICS;
	}
	
};

Payload.Units.GRAPHICS_TO_PHYSICS		= 1 / Payload.Units.RATIO;
Payload.Units.PHYSICS_TO_GRAPHICS		= Payload.Units.RATIO;

Payload.Units.p2g = Payload.Units.physicsToGraphics;
Payload.Units.g2p = Payload.Units.graphicsToPhysics;

// requires: core.js

/**
 * Base class for any (non HTMLElement) object which dispatches or listens for events
 * @module Payload.EventDispatcher
 * @memberof Payload
 */
Payload.EventDispatcher = function()
{
	Payload.assert(this instanceof Payload.EventDispatcher, "Inheritence assertion failed, did you forget to call extend?");
	
	this._listenersByType = {};
}

/**
 * Adds an event listener on this object
 * @method
 * @memberof Payload.EventDispatcher
 * @param {string} type The event type, or multiple types separated by spaces
 * @param {function} callback The callback to call when the event fires
 * @param {object} [thisObject] The object to use as "this" when firing the callback
 * @param {bool} [useCapture] If true, fires the callback on the capture phase, as opposed to bubble phase
 */
Payload.EventDispatcher.prototype.addEventListener = function(type, listener, thisObject, useCapture)
{
	var types = type.split(/\s+/);
	if(types.length > 1)
	{
		for(var i = 0; i < types.length; i++)
			this.addEventListener(types[i], listener, thisObject, useCapture);
		
		return;
	}
	
	if(!(listener instanceof Function))
		throw new Error("Listener must be a function");

	var target;
	if(!this._listenersByType.hasOwnProperty(type))
		target = this._listenersByType[type] = [];
	else
		target = this._listenersByType[type];
	
	var obj = {
		listener: listener,
		thisObject: (thisObject ? thisObject : this),
		useCapture: (useCapture ? true : false)
		};
		
	target.push(obj);
}

/**
 * Alias for addEventListener
 * @method
 * @memberof Payload.EventDispatcher
 * @see Payload.EventDispatcher#addEventListener
 */
Payload.EventDispatcher.prototype.on = Payload.EventDispatcher.prototype.addEventListener;

/**
 * Removes event listeners from this object
 * @method
 * @memberof Payload.EventDispatcher
 * @param {string} type The event type to remove listeners from
 * @param {function} [listener] The function to remove. If omitted, all listeners will be removed
 * @param {object} [thisObject] Use the parameter to remove listeners bound with the same thisObject
 * @param {bool} [useCapture] Remove the capture phase event listener. Otherwise, the bubble phase event listener will be removed.
 */
Payload.EventDispatcher.prototype.removeEventListener = function(type, listener, thisObject, useCapture)
{
	var arr, index, obj;

	if(!(arr = this._listenersByType[type]))
		return;
		
	if(!thisObject)
		thisObject = this;
		
	useCapture = (useCapture ? true : false);
	
	for(var i = 0; i < arr.length; i++)
	{
		obj = arr[i];
	
		if((arguments.length == 1 || obj.listener == listener) && obj.thisObject == thisObject && obj.useCapture == useCapture)
		{
			arr.splice(i, 1);
			return;
		}
	}
}

/**
 * Alias for removeEventListener
 * @method
 * @memberof Payload.EventDispatcher
 * @see Payload.EventDispatcher#removeEventListener
 */
Payload.EventDispatcher.prototype.off = Payload.EventDispatcher.prototype.removeEventListener;

/**
 * Test for listeners of type on this object
 * @method
 * @memberof Payload.EventDispatcher
 * @param {string} type The event type to test for
 * @return {bool} True if this object has listeners bound for the specified type
 */
Payload.EventDispatcher.prototype.hasEventListener = function(type)
{
	return (_listenersByType[type] ? true : false);
}

/**
 * Fires an event on this object
 * @method
 * @memberof Payload.EventDispatcher
 * @param {string|Payload.Event} event Either the event type as a string, or an instance of Payload.Event
 */
Payload.EventDispatcher.prototype.dispatchEvent = function(event)
{
	if(!(event instanceof Payload.Event))
	{
		if(typeof event == "string")
			event = new Payload.Event(event);
		else
		{
			var src = event;
			event = new Payload.Event();
			for(var name in src)
				event[name] = src[name];
		}
	}

	event.target = this;
		
	var path = [];
	for(var obj = this.parent; obj != null; obj = obj.parent)
		path.unshift(obj);
	
	event.phase = Payload.Event.CAPTURING_PHASE;
	for(var i = 0; i < path.length && !event._cancelled; i++)
		path[i]._triggerListeners(event);
		
	if(event._cancelled)
		return;
		
	event.phase = Payload.Event.AT_TARGET;
	this._triggerListeners(event);
		
	event.phase = Payload.Event.BUBBLING_PHASE;
	for(i = path.length - 1; i >= 0 && !event._cancelled; i--)
		path[i]._triggerListeners(event);
	
	// Native DOM event
	var topMostElement = this.element;
	for(var obj = this.parent; obj != null; obj = obj.parent)
	{
		if(obj.element)
			topMostElement = obj.element;
	}
	
	if(topMostElement)
	{
		var customEvent = {};
		
		for(var key in event)
		{
			var value = event[key];
			
			if(key == "type")
				value += ".Payload";
			
			customEvent[key] = value;
		}
		
		$(topMostElement).trigger(customEvent);
	}
}

/**
 * Alias for removeEventListener
 * @method
 * @memberof Payload.EventDispatcher
 * @see Payload.EventDispatcher#removeEventListener
 */
Payload.EventDispatcher.prototype.trigger = Payload.EventDispatcher.prototype.dispatchEvent;

/**
 * Handles the logic of triggering listeners
 * @method
 * @memberof Payload.EventDispatcher
 * @inner
 */
Payload.EventDispatcher.prototype._triggerListeners = function(event)
{
	var arr, obj;
	
	if(!(arr = this._listenersByType[event.type]))
		return;
		
	for(var i = 0; i < arr.length; i++)
	{
		obj = arr[i];
		
		if(event.phase == Payload.Event.CAPTURING_PHASE && !obj.useCapture)
			continue;
			
		obj.listener.call(arr[i].thisObject, event);
	}
}

/* requires: 
core.js
events/event-dispatcher.js
*/

/**
 * @module Payload.World
 * Handles physics, graphics, entities, updates etc.
 */

Payload.World = function(options)
{
	Payload.EventDispatcher.apply(this, arguments);
	
	if(!options)
		options = {};
	
	this.options = options = $.extend(true, {}, Payload.World.defaults, options);
	
	this.entities	= [];
	this.planets	= [];
	this.ships		= [];
	
	this.initPhysics();
	this.initGraphics();
	
	this.initPlanets(options);
	this.initShips(options);
	
	// this.enableDebugDraw();
	
	this.step();
}

Payload.extend(Payload.World, Payload.EventDispatcher);

Payload.World.defaults = {
	planet: {
		count: {
			minimum:		3,
			maximum:		9
		},
		radius: {
			minimum:		50,
			maximum:		1024
		},
		friction:			0.9,
		restitution:		0.0
	},
	ship: {
		radius:				20,
		launchFullPower:	5000,
		
		density:			1,
		friction:			0.9,
		restitution:		0.15,
		angularDamping:		0.3
	}
};

Payload.World.prototype.initPhysics = function()
{
	var self = this;
		
	this.b2World	= new Box2D.b2World(new Box2D.b2Vec2(0.0, 0.0));
	
	this.listener = new Box2D.JSContactListener();
	this.listener.BeginContact = function(contactPtr) {
		
		var contact = Box2D.wrapPointer(contactPtr, Box2D.b2Contact)
		
		var fixtureA = contact.GetFixtureA();
		var fixtureB = contact.GetFixtureB();
		
		var bodyA = fixtureA.GetBody();
		var bodyB = fixtureB.GetBody();
		
		var entityA = bodyA.entity;
		var entityB = bodyB.entity;
		
		Payload.assert(entityA != null, "No entity associated with body, did you forget to call Payload.Entity.initPhysics after initalising body?");
		Payload.assert(entityB != null, "No entity associated with body, did you forget to call Payload.Entity.initPhysics after initalising body?");
		
		if(entityA && entityB)
		{
			entityA.onCollision(entityB, fixtureA, fixtureB);
			entityB.onCollision(entityA, fixtureB, fixtureA);
		}
		
	};
	
	// Empty implementations for unused methods.
	this.listener.EndContact = function() {};
	this.listener.PreSolve = function() {};
	this.listener.PostSolve = function() {};
	
	this.b2World.SetContinuousPhysics(1);
	this.b2World.SetContactListener(this.listener);
}

Payload.World.prototype.initGraphics = function()
{
	var width			= window.innerWidth;
	var height			= window.innerHeight;
	
	// Actual graphics
	this.scene			= new THREE.Scene();
	
	this.camera			= new THREE.OrthographicCamera(
		width / -2,
		width / 2,
		height / 2,
		height / -2,
		1,
		1000
	);
	
	this.camera.position.z = -500;
	this.camera.rotation.set(-Math.PI, 0, 0);
	
	this.scene.add(this.camera);
	
	this.renderer		= new THREE.WebGLRenderer({
		antialias: true
	});
	this.renderer.setSize(width, height);
	
	// Add renderer DOM element
	document.querySelector("#scene").appendChild(this.renderer.domElement);
	
	// And mouse interaction
	this.interaction = new Payload.Interaction(this.camera, this.renderer.domElement);
}

Payload.World.prototype.initPlanets = function(options)
{
	var numPlanets = options.planet.count.minimum + Math.round(Math.random() * (options.planet.count.maximum - options.planet.count.minimum));
	
	for(var i = 0; i < numPlanets; i++)
	{
		var planet = new Payload.Planet(this, {
			position: {
				x: (-0.5 + Math.random()) * options.planet.radius.maximum * 12,
				y: (-0.5 + Math.random()) * options.planet.radius.maximum * 12
			}
		});
		
		this.add(planet);
	}
}

Payload.World.prototype.initShips = function(options)
{
	// A single debug ship
	
	// TODO: Move this to a spawn / teleport function on the ship ideally. It'll need to be reused for teleport.
	
	// NB: Maximum of 64 attempts to place the ship. Placing a ship inside a planet causes very odd behaviour with Box2D
	var position, entities;
	var max				= 64;
	
	for(var attempt = 0; attempt < max; attempt++)
	{
		var index		= Math.floor( Math.random() * this.planets.length );
		var planet		= this.planets[index];
		
		position		= planet.getPointOnSurface({
			additionalRadius: options.ship.radius
		});
		
		entities		= this.getEntitiesAtPosition(position);
		
		if(entities.length == 0)
			break;
	}
	
	if(attempt == max)
		throw new Error("Maximum number of attempts to place ship hit");
	
	if(attempt > max * 0.8)
		console.warn("High number of attempts to find spawn point for ship");
	
	var options			= $.extend({}, options.ship, {
		position: position
	});
	
	var ship		= new Payload.Ship(this, options);
	this.add(ship);
}

Payload.World.prototype.add = function(entity)
{
	Payload.assert(entity instanceof Payload.Entity, "Not an Entity");
	
	this.entities.push(entity);
	entity.parent = this;
	
	if(entity instanceof Payload.Planet)
		this.planets.push(entity);
	else if(entity instanceof Payload.Ship)
		this.ships.push(entity);
	
	if(entity.object3d)
		this.scene.add(entity.object3d);
	
	entity.trigger("added");
}

Payload.World.prototype.remove = function(entity)
{
	Payload.assert(entity instanceof Payload.Entity, "Not an Entity");
	
	var index = this.entities.indexOf(entity);
	
	Payload.assert(index != -1, "Not in entity list");
	
	this.entities.splice(index, 1);
	this.entity.parent = null;
	
	if(entity instanceof Payload.Planet)
	{
		index = this.planets.indexOf(entity);
		
		Payload.assert(index != -1, "Not in planet list");
		
		this.planets.splice(index, 1);
	}
	else if(entity instanceof Payload.Ship)
	{
		index = this.planets.indexOf(entity);
		
		Payload.assert(index != -1, "Not in planet list");
		
		this.planets.splice(index, 1);
	}
	
	this.entity.trigger("removed");
}

Payload.World.prototype.getEntitiesAtPosition = function(position, limit)
{
	Payload.assert("x" in position && "y" in position);
	Payload.assert($.isNumeric(position.x) && $.isNumeric(position.y));
	
	if(arguments.length < 2)
		limit = Infinity;
	else
		Payload.assert($.isNumeric(limit) && limit > 0, "Invalid limit");
	
	var entities = [];
	var callback = new Box2D.JSQueryCallback();

	callback.ReportFixture = function(fixturePtr) {
		
		var fixture = Box2D.wrapPointer( fixturePtr, Box2D.b2Fixture );
		
		if ( ! fixture.TestPoint( this.m_point ) )
			return true;	// Not touching
		
		var body	= fixture.GetBody();
		var entity	= body.entity;
		
		Payload.assert(entity != null, "No entity associated with body, did you forget to call Payload.Entity.initPhysics after initalising body?");
		
		if(entities.indexOf(entity) > -1)
			return true;	// Already in list
		
		entities.push(entity);
		
		if(entities.length >= limit)
			return false;
		
		return true;
		
	};
	
	var x = Payload.Units.g2p(position.x);
	var y = Payload.Units.g2p(position.y);
	
	callback.m_fixture = null;
	callback.m_point = new Box2D.b2Vec2(x, y);
	
	var aabb = new Box2D.b2AABB();
	var d = 0.01;        
	aabb.set_lowerBound(new Box2D.b2Vec2(x - d, y - d));
	aabb.set_upperBound(new Box2D.b2Vec2(x + d, y + d));

	this.b2World.QueryAABB( callback, aabb ); // the AABB is a tiny square around the current mouse position
	
	return entities;
}

Payload.World.prototype.step = function()
{
	var self = this;
	
	if(window.stats)
		window.stats.begin();
	
	var start	= new Date().getTime();
	this.b2World.Step(1 / 30, 10, 10);
	var end		= new Date().getTime();
	var delta	= end - start;
	
	// Entities
	for(var i = 0; i < this.entities.length; i++)
		this.entities[i].update();
	
	// Rendering
	this.renderer.render(this.scene, this.camera);
	
	if(this.debugDrawEnabled)
	{
		this.context.resetTransform();
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		
		this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
		
		this.context.scale(this.camera.zoom, this.camera.zoom);
		this.context.translate(-this.camera.position.x, -this.camera.position.y);
		
		this.context.scale(
			Payload.Units.PHYSICS_TO_GRAPHICS,
			Payload.Units.PHYSICS_TO_GRAPHICS
		);
		
		this.b2World.DrawDebugData();
	}
	
	if(delta > 5000)
		throw new Error("Physics engine stalled");
	
	requestAnimationFrame(function() {
		self.step();
	});
	
	if(window.stats)
		window.stats.end();
}

Payload.World.prototype.enableDebugDraw = function()
{
	var e_shapeBit = 0x0001;
	var e_jointBit = 0x0002;
	var e_aabbBit = 0x0004;
	var e_pairBit = 0x0008;
	var e_centerOfMassBit = 0x0010;
	var debugDraw = this._debugDraw = getCanvasDebugDraw();
	
	var width			= window.innerWidth;
	var height			= window.innerHeight;
	
	if(!this.canvas)
	{
		// Debug canvas
		this.canvas			= document.createElement("canvas");
		this.canvas.id		= "debug-draw";
		
		this.canvas.width	= width;
		this.canvas.height	= height;
		this.context 		= this.canvas.getContext("2d");
		
		document.querySelector("#scene").appendChild(this.canvas);
		
		window.context = this.context;
	
		this.b2World.SetDebugDraw( debugDraw );
		debugDraw.SetFlags(e_pairBit | e_shapeBit | e_centerOfMassBit);
	}
	
	this.debugDrawEnabled = true;
}
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
/* requires: 
core.js
events/event-dispatcher.js
*/

/**
 * @module Payload.Entity
 * Base class for entities, which can optionally be audible, visible or phsyical
 */
Payload.Entity = function(world, options)
{
	Payload.assert(world instanceof Payload.World);
	
	Payload.EventDispatcher.call(this);
	
	this.world = world;
	
	this.initPhysics(options);
	this.initGraphics(options);
	this.initAudio(options);
	
	this.setOptions(options);
}

Payload.extend(Payload.Entity, Payload.EventDispatcher);

Object.defineProperty(Payload.Entity.prototype, "isAffectedByGravity", {
	
	"get": function()
	{
		if(!this.b2Body)
			return false;
		
		if(this instanceof Payload.Planet)
			return false;
		
		return true;
	}
	
});

Object.defineProperty(Payload.Entity.prototype, "position", {
	
	"get": function()
	{
		if(this.b2Body)
		{
			var vec = this.b2Body.GetWorldCenter();
			
			return {
				x: vec.get_x() * Payload.Units.PHYSICS_TO_GRAPHICS,
				y: vec.get_y() * Payload.Units.PHYSICS_TO_GRAPHICS
			};
		}
		
		if(this.object3d)
		{
			return {
				x: this.object3d.position.x,
				y: this.object3d.position.y
			};
		}
		
		throw new Error("Entity has no body or object to get position from");
	},
	
	"set": function(position)
	{
		Payload.assert("x" in position && $.isNumeric(position.x));
		Payload.assert("y" in position && $.isNumeric(position.y));
		
		var x = position.x;
		var y = position.y;
		
		if(this.b2Body)
			this.b2Body.SetTransform(
				new Box2D.b2Vec2(
					x * Payload.Units.GRAPHICS_TO_PHYSICS, 
					y * Payload.Units.GRAPHICS_TO_PHYSICS),
				0
			);
			
		if(this.object3d)
			this.object3d.position.set(x, y, 0);
	}
	
});

Payload.Entity.prototype.initPhysics = function()
{
	if(this.b2Body)
		this.b2Body.entity = this;
}

Payload.Entity.prototype.initGraphics = function()
{
	
}

Payload.Entity.prototype.initAudio = function()
{
	
}

Payload.Entity.prototype.setOptions = function(options)
{
	if(!options)
		return;
	
	if("position" in options)
		this.position = options.position;
}

Payload.Entity.prototype.update = function()
{
	if(this.b2Body && this.object3d)
	{
		var position	= this.b2Body.GetWorldCenter();
		var angle		= this.b2Body.GetAngle();
		
		var x			= position.get_x() * Payload.Units.PHYSICS_TO_GRAPHICS;
		var y			= position.get_y() * Payload.Units.PHYSICS_TO_GRAPHICS;
		
		Payload.assert(!isNaN(x));
		Payload.assert(!isNaN(y));
		Payload.assert(!isNaN(angle));
		
		this.object3d.position.set(x, y, 0);
		this.object3d.rotation.set(0, 0, angle);
	}
}

Payload.Entity.prototype.onCollision = function(entity, localFixture, otherFixture)
{
	this.trigger("collision");
}

Payload.Entity.prototype.remove = function()
{
	if(this.b2Body)
	{
		this.world.b2World.DestroyBody(this.b2Body);
		this.b2Body = null;
	}
	
	if(this.object3d)
	{
		this.world.scene.remove(this.object3d);
		this.object3d = null;
	}
	
	this.world.remove(this);
	this.world = null;
}

Payload.Entity.prototype.launch = function(options)
{
	Payload.assert(options != null);
	
	if("x" in options && "y" in options)
	{
		
	}
	else if("degrees" in options && "power" in options)
	{
		
	}
}

Payload.Entity.prototype.detonate = function()
{
	// Take option for EMP / explosion
}
// requires: entities/entity.js

Payload.Planet = function(world, options)
{
	this._fixtureDestructionQueue = [];
	this._fixturesByFaceIndex = [];
	
	this.options = options;
	
	// NB: Do this here because initMesh is called before Entity sets it
	this.world = world;
	
	this.initMesh(options);
	
	Payload.Entity.apply(this, arguments);
}

Payload.extend(Payload.Planet, Payload.Entity);

Payload.Planet.spherize = function(img)
{
	var size = 512;
	var src = document.createElement("canvas");
	
	src.width = size;
	src.height = size;
	
	var srcctx = src.getContext("2d");
	srcctx.drawImage(img, 0, 0);
	
	var dst		= document.createElement("canvas");
	dst.width = dst.height = size;
	
	var dstctx	= dst.getContext("2d");
	
	dstctx.fillStyle = "red";
	dstctx.fillRect(0, 0, 512, 512);
	
	var srcpixels = srcctx.getImageData(0, 0, size, size).data;
	var dstpixels = srcpixels.slice();
	
	dstpixels.fill(0);
	
	function copyPixel(srcx, srcy, dstx, dsty)
	{
		var srcpos = (4 * srcy * size) + (4 * srcx);
		var dstpos = (4 * dsty * size) + (4 * dstx);
		
		dstpixels[dstpos]	= srcpixels[srcpos];
		dstpixels[dstpos+1]	= srcpixels[srcpos+1];
		dstpixels[dstpos+2]	= srcpixels[srcpos+2];
		dstpixels[dstpos+3]	= srcpixels[srcpos+3];
	}
	
	for(var y = 0; y < size; y++)
	{
		var ny	= ((2 * y) / size) - 1;
		var ny2	= ny * ny;
		
		for(var x = 0; x < size; x++)
		{
			var nx		= ((2 * x) / size) - 1;
			var nx2		= nx * nx;
			
			var r		= Math.sqrt(nx2 + ny2);
			
			if(r > 1)
				continue;
			
			var nr		= Math.sqrt(1 - r * r);
			nr			= (r + (1.0 - nr)) / 2;
			
			if(nr > 1)
				continue;
			
			var theta	= Math.atan2(ny, nx);
			var nxn		= nr * Math.cos(theta);
			var nyn		= nr * Math.sin(theta);
			var x2		= parseInt( ((nxn+1) * size) / 2 );
			var y2		= parseInt( ((nyn+1) * size) / 2 );
			
			copyPixel(x2, y2, x, y);
		}
	}
	
	var temp = new ImageData(size, size);
	temp.data.set(dstpixels);
	
	srcctx.putImageData(temp, 0, 0);
	
	return src;
}

Payload.Planet.prototype.initMesh = function(options)
{
	var minRadius = this.world.options.planet.radius.minimum;
	var maxRadius = this.world.options.planet.radius.maximum;
	
	var radius = this._radius = minRadius + (Math.random() * Math.round(maxRadius - minRadius));
	var density = this._density = 0.5 + (Math.random() * 2);
	
	var area = this._area		= Math.PI * Math.pow(radius, 2);
	var sides = this._sides		= Math.round( Math.sqrt(radius) * Math.PI );
	var cx = 0;
	var cy = 0;
	
	var sites = [];
	
	for(var i = 0; i < sides; i++)
	{
		var angle = (i / sides) * Math.PI * 2;
	
		sites.push([
			cx + Math.sin(angle) * radius,
			cy + Math.cos(angle) * radius
		]);
	}
	
	var power	= 2;	// Higher powers will bias points towards the surface, 2 will give an even distribution
	var inner	= Math.round(Math.sqrt(area)) * density;
	
	for(var i = 0; i < inner; i++)
	{
		var a = Math.random() * 2 * Math.PI;
		var r = radius * Math.pow(Math.random(), 1 / power);
		
		sites.push([
			cx + Math.sin(a) * r,
			cy + Math.cos(a) * r
		]);
	}
	
	var delaunator	= Delaunator.from(sites);
	
	this._vertices	= sites;
	this._indices	= delaunator.triangles;
}

Payload.Planet.prototype.initPhysics = function(options)
{
	var sites		= this._vertices;
	var triangles	= this._indices;
	
	this._destructionGravityMultiplier = 1;
	this.b2CenterOfGravity = new Box2D.b2Vec2();
	
	this.b2BodyDef	= new Box2D.b2BodyDef();
	
	this.b2Body		= this.world.b2World.CreateBody(this.b2BodyDef);
	
	Payload.Entity.prototype.initPhysics.call(this);
	
	function convertPoint(point, scale)
	{
		if(!scale)
			scale = 1;
		
		return new Box2D.b2Vec2(
			point[0] * scale,
			point[1] * scale
		);
	}
	
	function createPolygonShape(vertices) {
		var shape = new Box2D.b2PolygonShape();
		// var buffer = Box2D.allocate(vertices.length * 8, 'float', Box2D.ALLOC_STACK);
		var buffer = Box2D._malloc(vertices.length * 8);
		var offset = 0;
		for (var i = 0; i < vertices.length; i++) {
			// Box2D.setValue(buffer + (offset), vertices[i].get_x(), 'float'); // x
			Box2D.HEAPF32[buffer + offset >> 2] = vertices[i].get_x();
			// Box2D.setValue(buffer + (offset + 4), vertices[i].get_y(), 'float'); // y
			Box2D.HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].get_y();
			offset += 8;
		}
		var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
		shape.Set(ptr_wrapped, vertices.length);
		return shape;
	}
	
	for(var i = 0; i < triangles.length; i += 3)
	{
		var vertices = [];
		
		vertices.push( convertPoint(sites[triangles[i+2]], Payload.Units.GRAPHICS_TO_PHYSICS) );
		vertices.push( convertPoint(sites[triangles[i+1]], Payload.Units.GRAPHICS_TO_PHYSICS) );
		vertices.push( convertPoint(sites[triangles[i]]  , Payload.Units.GRAPHICS_TO_PHYSICS) );
		vertices.push( convertPoint(sites[triangles[i+2]], Payload.Units.GRAPHICS_TO_PHYSICS) );
		
		var shape = createPolygonShape(vertices);
		
		var fixtureDef = new Box2D.b2FixtureDef();
		fixtureDef.set_density(this._density);
		fixtureDef.set_friction(this.world.options.planet.friction);
		fixtureDef.set_restitution(this.world.options.planet.restitution);
		fixtureDef.set_shape(shape);
		
		var fixture = this.b2Body.CreateFixture(fixtureDef);
		this._fixturesByFaceIndex[parseInt(i / 3)] = fixture;
	}
}

Payload.Planet.prototype.initGraphics = function()
{
	// Materials first
	var materials = {
		"damage":	null,
		"surface":	null
	};
	
	for(var type in materials)
	{
		var asset	= payload.assets.textures.planet[type].random();
		var canvas	= Payload.Planet.spherize(asset.resource.image);
		
		materials[type] = new THREE.MeshBasicMaterial();
		materials[type].map = new THREE.CanvasTexture(canvas);
	}
	
	// Now build a mesh
	var v;
	
	this.object3d = new THREE.Object3D();
	
	this.damage = new THREE.Mesh(
		new THREE.CircleGeometry(this._radius, this._sides),
		materials.damage
	);
	this.damage.position.set(0, 0, 10);
	this.object3d.add(this.damage);
	
	this.geometry = new THREE.Geometry();
	
	for(var i = 0; i < this._vertices.length; i++)
	{
		v = this._vertices[i];
		this.geometry.vertices.push(new THREE.Vector3(v[0], v[1], 0));
	}
	
	for(var i = 0; i < this._indices.length; i += 3)
	{
		var faceIndex	= parseInt(i / 3);
		var fixture		= this._fixturesByFaceIndex[faceIndex];
		
		var face = new THREE.Face3(
			this._indices[i],
			this._indices[i + 1],
			this._indices[i + 2]
		);
		
		face.fixture = fixture;
		fixture.face = face;
		
		this.geometry.faces.push(face);
		
		var faceUVs = [];
		var radius2	= this._radius * 2;
		
		for(var j = 0; j < 3; j++)
		{
			var vertex = this._vertices[ this._indices[i + j] ];
			var vector = new THREE.Vector2(
				0.5 + (vertex[0] / radius2),
				0.5 + (vertex[1] / radius2)
			);
			
			faceUVs.push(vector);
		}
		
		this.geometry.faceVertexUvs[0].push(faceUVs);
	}
	
	this.surface = new THREE.Mesh(this.geometry, materials.surface);
	this.object3d.add(this.surface);
	
	delete this._fixturesByFaceIndex;
}

Payload.Planet.prototype.getPointOnSurface = function(options)
{
	var radius = this._radius;
	var position = this.position;
	
	if(!options)
		options = {};
	
	if(!options.angle)
		options.angle = Math.random() * 2 * Math.PI;
	
	if(options.additionalRadius)
		radius += options.additionalRadius;
	
	return {
		x: position.x + (Math.cos(options.angle) * radius),
		y: position.y + (-Math.sin(options.angle) * radius)
	};
}

Payload.Planet.prototype.applyGravity = function(entity)
{
	Payload.assert(entity.isAffectedByGravity);
	
	var radius	= this._radius;
	var gravity	= radius * this._destructionGravityMultiplier;
	
	var center	= this.b2Body.GetWorldCenter();
	var target	= entity.b2Body.GetWorldCenter();
	
	var delta	= new Box2D.b2Vec2(0, 0);
	delta.op_add(target);
	delta.op_sub(center);
	delta.op_sub(this.b2CenterOfGravity);
	
	var distance = delta.Length();
	
	// Skip distance check distance < 3 * radius
	
	delta.Set(
		-delta.get_x(),
		-delta.get_y()
	);
	
	var sum		= Math.abs(delta.get_x()) + Math.abs(delta.get_y());
	delta.op_mul((1 / sum) * gravity / distance);
	
	entity.b2Body.ApplyForceToCenter(delta);
}

Payload.Planet.prototype.applyFixtureDamage = function(fixture)
{
	if(this._fixtureDestructionQueue.indexOf(fixture) > -1)
		return;
	
	this._fixtureDestructionQueue.push(fixture);
}

Payload.Planet.prototype.handleMeshDestruction = function()
{
	var self = this;
	var updateMesh = this._fixtureDestructionQueue.length > 0;
	
	while(this._fixtureDestructionQueue.length)
	{
		var fixture = this._fixtureDestructionQueue.pop();
		
		var index = this.geometry.faces.indexOf(fixture.face);
		this.geometry.faces.splice(index, 1);
		this.geometry.faceVertexUvs[0].splice(index, 1);
		
		this.b2Body.DestroyFixture(fixture);
	}
	
	if(updateMesh)
	{
		// TODO: Calculate new mass based on remaining surface area
		// TODO: Calculate new center of gravity based on triangles
		
		if(this.geometry.faces.length)
		{
			this.geometry.elementsNeedUpdate = true;
			this.geometry.uvsNeedUpdate = true;
		}
		else
		{
			this.remove();
			return;
		}
		
		// Calculate new center of mass and area
		var vertexIDsByKey = {};
		var areaDestroyed = 0;
		var initialArea = Math.PI * (this._radius * this._radius);
		
		function area(ia, ib, ic)
		{
			var va = self._vertices[ia];
			var vb = self._vertices[ib];
			var vc = self._vertices[ic];
			
			var x1 = va[0];
			var x2 = vb[0];
			var x3 = vc[0];
			
			var y1 = va[1];
			var y2 = vb[1];
			var y3 = vc[1];
			
			return Math.abs(0.5*(x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2)));
		}
		
		for(var i = 0; i < this.geometry.faces.length; i++)
		{
			var face = this.geometry.faces[i];
			
			vertexIDsByKey[face.a] = true;
			vertexIDsByKey[face.b] = true;
			vertexIDsByKey[face.c] = true;
			
			areaDestroyed += area(face.a, face.b, face.c);
		}
		
		var usedVertexIDs = Object.keys(vertexIDsByKey);
		var centerOfMass = {x: 0, y: 0};
		
		usedVertexIDs.forEach(function(index) {
			
			var vertex = self._vertices[index];
			
			centerOfMass.x += vertex[0];
			centerOfMass.y += vertex[1];
			
		});
		
		centerOfMass.x /= usedVertexIDs.length;
		centerOfMass.y /= usedVertexIDs.length;
		
		this.b2CenterOfGravity = new Box2D.b2Vec2(
			Payload.Units.g2p(centerOfMass.x),
			Payload.Units.g2p(centerOfMass.y)
		);
		
		if(areaDestroyed > 0)
			this._destructionGravityMultiplier = areaDestroyed / initialArea;
	}
}

Payload.Planet.prototype.handleGravity = function()
{
	for(var i = 0; i < this.world.entities.length; i++)
	{
		var entity = this.world.entities[i];
		
		if(!entity.isAffectedByGravity)
			continue;
			
		this.applyGravity(entity);
	}
}

Payload.Planet.prototype.update = function()
{
	this.handleMeshDestruction();
	this.handleGravity();
	
	// Payload.Entity.prototype.update.apply(this, arguments);
}
// requires: entities/entity.js

Payload.Ship = function(world, options)
{
	Payload.Entity.apply(this, arguments);
}

Payload.extend(Payload.Ship, Payload.Entity);

Payload.Ship.prototype.initPhysics = function(options)
{
	this.b2BodyDef = new Box2D.b2BodyDef();
	this.b2BodyDef.set_type( Box2D.b2_dynamicBody );
	
	this.b2Body	= this.world.b2World.CreateBody(this.b2BodyDef);
	this.b2Body.SetAngularDamping(options.angularDamping);
	
	Payload.Entity.prototype.initPhysics.call(this);
	
	var radius	= Payload.Units.g2p(options.radius);
	var shape	= new Box2D.b2PolygonShape();
	
	shape.SetAsBox(1, 1);
	
	var fixtureDef = new Box2D.b2FixtureDef();
	fixtureDef.set_density(options.density);
	fixtureDef.set_friction(options.friction);
	fixtureDef.set_restitution(options.restitution);
	fixtureDef.set_shape(shape);
	
	this.b2Body.CreateFixture(fixtureDef);
}

Payload.Ship.prototype.initGraphics = function(options)
{
	var radius = options.radius;
	
	var geometry = new THREE.BoxGeometry(radius * 2, radius * 2, radius * 2);
	var material = new THREE.MeshBasicMaterial({color: 0xff0000});
	
	this.object3d = new THREE.Mesh(geometry, material);
}
// requires: core.js
		
/**
 * Base class used for events (for non-HTMLElement objects)
 * @module Payload.Event
 * @memberof Payload
 * @param {string|object} options The event type as a string, or an object of options to be mapped to this event
 */
Payload.Event = function(options)
{
	if(typeof options == "string")
		this.type = options;
	
	this.bubbles		= true;
	this.cancelable		= true;
	this.phase			= Payload.Event.PHASE_CAPTURE;
	this.target			= null;
	
	this._cancelled = false;
	
	if(typeof options == "object")
		for(var name in options)
			this[name] = options[name];
}

Payload.Event.CAPTURING_PHASE		= 0;
Payload.Event.AT_TARGET				= 1;
Payload.Event.BUBBLING_PHASE		= 2;

/**
 * Prevents any further propagation of this event
 * @method
 * @memberof Payload.Event
 */
Payload.Event.prototype.stopPropagation = function()
{
	this._cancelled = true;
}

// requires: entities/entity.js

Payload.Weapon = function(world)
{
	Payload.Entity.apply(this, arguments);
}

Payload.extend(Payload.Weapon, Payload.Entity);

Payload.Weapon.prototype.fire = function()
{
	
}

// requires: weapons/weapon.js

Payload.Bomb = function(world)
{
	Payload.Weapon.apply(this, arguments);
}

Payload.extend(Payload.Bomb, Payload.Weapon);

Payload.Bomb.prototype.fire = function(options)
{
	var self = this;
	
	// Create a new projectile at the specified position
	var projectile = new Payload.Projectile(options);
	
	// Collision listener for this projectile
	projectile.on("collision", function(event) {
		
		// Bang!
		projectile.detonate({
			damage: 5,
			radius: 50
		});
		
		// Let the game know this weapon is finished so the turn can end
		self.trigger("complete");
		
	});
	
	// Launch the projectile and the specified angle and power
	projectile.launch(options);
}

// requires: entities/entity.js

Payload.Projectile = function(world, options)
{
	Payload.Entity.apply(this, arguments);
}

Payload.extend(Payload.Projectile, Payload.Entity);

//# sourceMappingURL=main.js.map
