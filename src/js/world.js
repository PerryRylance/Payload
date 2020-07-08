/* requires: 
core.js
events/event-dispatcher.js
*/

/**
 * @module Payload.World
 * Handles physics, graphics, entities, updates etc.
 */

Payload.World = function(game, options)
{
	Payload.EventDispatcher.apply(this, arguments);
	
	if(!options)
		options = {};
	
	this.options = options = $.extend(true, {}, Payload.World.defaults, options);
	
	this.game		= game;
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

Payload.World.prototype.initShipForPlayer = function(player, options)
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
	
	var ship		= new Payload.Ship(this, 
		$.extend({}, options.ship, {
			position: position
		})
	);
	
	this.add(ship);
	player.ship = ship;
}

Payload.World.prototype.initShips = function(options)
{
	var self = this;
	
	this.game.players.forEach(function(player) {
		
		self.initShipForPlayer(player, options);
		
	});
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