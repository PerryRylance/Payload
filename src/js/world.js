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
			minimum:	3,
			maximum:	9
		},
		radius: {
			minimum:	50,
			maximum:	1024
		},
		friction:		0.9,
		restitution:	0.0
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
	// var ship = new Payload.Ship();
	// this.add(ship);
}

Payload.World.prototype.add = function(entity)
{
	Payload.assert(entity instanceof Payload.Entity, "Not an Entity");
	
	this.entities.push(entity);
	entity.parent = this;
	
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
	
	this.entity.trigger("removed");
}

Payload.World.prototype.step = function()
{
	var self = this;
	
	if(window.stats)
		window.stats.begin();
	
	this.b2World.Step(1 / 30, 10, 10);
	
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