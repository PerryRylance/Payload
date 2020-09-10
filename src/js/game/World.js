import EventDispatcherWithOptions from "../EventDispatcherWithOptions";
import Game from "./Game";
import Units from "./Units";
import Interaction from "./Interaction";
import Entity from "./entities/Entity";

import Planet from "./entities/Planet";
import Ship from "./entities/Ship";

import Emitter from "./entities/particles/Emitter";

export default class World extends EventDispatcherWithOptions
{
	constructor(game, options)
	{
		Payload.assert(game instanceof Game)
		
		if(!options)
			options = {};
		
		options = $.extend(true, {}, World.defaults, options);
		
		super(options);
		
		this.options	= options;
		
		this.game		= game;
		this.entities	= [];
		this.planets	= [];
		this.ships		= [];
		
		this.initPhysics();
		this.initGraphics();
		
		this.initPlanets(options);
		this.initShips(options);
		
		// this.enableDebugDraw();
		
		this.currentStep = 0;
		this.step();
	}
	
	initPhysics()
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
		
		// this.b2World.SetContinuousPhysics(1);
		this.b2World.SetContactListener(this.listener);
	}
	
	initGraphics()
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
		
		this.camera.position.z = 500;
		
		this.scene.add(this.camera);
		
		this.renderer		= new THREE.WebGLRenderer({
			antialias: true
		});
		this.renderer.setSize(width, height);
		
		// Add renderer DOM element
		document.querySelector("#scene").appendChild(this.renderer.domElement);
		
		// Add lighting
		var light = new THREE.AmbientLight( 0x7f7f7f ); // soft white light
		this.scene.add( light );
		
		var light = new THREE.DirectionalLight( 0xffffff, 1.0 );
		light.position.set(5, 0, 15);
		this.scene.add( light );
		
		// And mouse interaction
		this.interaction = new Interaction(this.camera, this.renderer.domElement);
	}
	
	initPlanets(options)
	{
		var game		= this.game;
		var numPlanets	= options.planet.count.minimum + Math.round(game.random() * (options.planet.count.maximum - options.planet.count.minimum));
		
		for(var i = 0; i < numPlanets; i++)
		{
			var planet = new Planet(this, {
				position: {
					x: (-0.5 + game.random()) * options.planet.radius.maximum * 12,
					y: (-0.5 + game.random()) * options.planet.radius.maximum * 12
				}
			});
			
			this.add(planet);
		}
	}
	
	initShips(options)
	{
		this.game.players.forEach( (player) => this.initShipForPlayer(player, options) );
	}
	
	initShipForPlayer(player, options)
	{
		// A single debug ship
		// TODO: Move this to a spawn / teleport function on the ship ideally. It'll need to be reused for teleport.
		// NB: Maximum of 64 attempts to place the ship. Placing a ship inside a planet causes very odd behaviour with Box2D
		
		var position, entities;
		var game			= this.game;
		var max				= 64;
		
		for(var attempt = 0; attempt < max; attempt++)
		{
			var index		= Math.floor( game.random() * this.planets.length );
			var planet		= this.planets[index];
			
			position		= planet.getPointOnSurface({
				additionalRadius: options.ship.radius * 2
			});
			
			entities		= this.getEntitiesAtPosition(position);
			
			if(entities.length == 0)
				break;
		}
		
		if(attempt == max)
			throw new Error("Maximum number of attempts to place ship hit");
		
		if(attempt > max * 0.8)
			console.warn("High number of attempts to find spawn point for ship");
		
		var ship		= new Ship(this, 
			$.extend({}, options.ship, {
				position: position
			})
		);
		
		this.add(ship);
		player.ship = ship;
		
		$(window).on("keydown", (event) => {
			
			if(event.which == 69)
			{
				var tempExplosion = new Emitter(this);
				this.add(tempExplosion);
			}
			
		});
		
		// tempExplosion.attachTo(ship);
	}
	
	add(entity)
	{
		Payload.assert(entity instanceof Entity, "Not an Entity");
		
		this.entities.push(entity);
		entity.parent = this;
		
		if(entity instanceof Planet)
			this.planets.push(entity);
		else if(entity instanceof Ship)
			this.ships.push(entity);
		
		if(entity.object3d)
			this.scene.add(entity.object3d);
		
		entity.trigger("added");
	}
	
	remove(entity)
	{
		Payload.assert(entity instanceof Entity, "Not an Entity");
		
		var index = this.entities.indexOf(entity);
		
		Payload.assert(index != -1, "Not in entity list");
		
		this.entities.splice(index, 1);
		
		entity.parent = null;
		
		if(entity instanceof Planet)
		{
			index = this.planets.indexOf(entity);
			Payload.assert(index != -1, "Not in planet list");
			this.planets.splice(index, 1);
		}
		else if(entity instanceof Ship)
		{
			index = this.planets.indexOf(entity);
			Payload.assert(index != -1, "Not in planet list");
			this.planets.splice(index, 1);
		}
		
		entity.trigger("removed");
	}
	
	getEntitiesAtPosition(position, limit)
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
		
		var x = position.x * Units.GRAPHICS_TO_PHYSICS;
		var y = position.y * Units.GRAPHICS_TO_PHYSICS;
		
		callback.m_fixture = null;
		callback.m_point = new Box2D.b2Vec2(x, y);
		
		var aabb = new Box2D.b2AABB();
		var d = 0.01;        
		aabb.set_lowerBound(new Box2D.b2Vec2(x - d, y - d));
		aabb.set_upperBound(new Box2D.b2Vec2(x + d, y + d));

		this.b2World.QueryAABB( callback, aabb ); // the AABB is a tiny square around the current mouse position
		
		return entities;
	}
	
	step()
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
		
		this.interaction.update();
		
		// Rendering
		this.renderer.render(this.scene, this.camera);
		
		if(this.debugDrawEnabled)
		{
			this.context.resetTransform();
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			
			this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
			
			this.context.scale(this.camera.zoom, -this.camera.zoom);
			this.context.translate(-this.camera.position.x, -this.camera.position.y);
			
			this.context.scale(
				Units.PHYSICS_TO_GRAPHICS,
				Units.PHYSICS_TO_GRAPHICS
			);
			
			this.b2World.DrawDebugData();
		}
		
		if(delta > 5000)
		{
			console.warn("Physics engine appears to have stalled, physics have been halted.");
			this.doPhysics = false;
		}
		
		requestAnimationFrame(function() {
			self.step();
		});
		
		if(window.stats)
			window.stats.end();
		
		this.currentStep++;
	}
	
	enableDebugDraw()
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
}

World.defaults = {
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