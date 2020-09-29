import Entity from "./Entity";
import Units from "../Units";
import Player from "../Player";
import Text from "./Text";
import Sound from "./Sound";
import Weapon from "../weapons/default/Weapon.js";

export default class Ship extends Entity
{
	constructor(world, player, options)
	{
		Payload.assert(player instanceof Player);
		
		super(world, options);
		
		this.health	= world.options.ship.health;
		this.player = player;
		this.parent = world; // For event bubbling
		this.state	= Ship.STATE_ALIVE;
		
		this.initLabel();
	}
	
	initPhysics(options)
	{
		this.b2BodyDef = new Box2D.b2BodyDef();
		this.b2BodyDef.set_type( Box2D.b2_dynamicBody );
		
		this.b2Body	= this.world.b2World.CreateBody(this.b2BodyDef);
		this.b2Body.SetAngularDamping(options.angularDamping);
		
		super.initPhysics(options);
		
		var radius	= options.radius * Units.GRAPHICS_TO_PHYSICS;
		var shape	= new Box2D.b2PolygonShape();
		
		shape.SetAsBox(radius, radius);
		
		var fixtureDef = new Box2D.b2FixtureDef();
		fixtureDef.set_density(options.density);
		fixtureDef.set_friction(options.friction);
		fixtureDef.set_restitution(options.restitution);
		fixtureDef.set_shape(shape);
		
		this.b2Body.CreateFixture(fixtureDef);
	}
	
	initGraphics(options)
	{
		super.initGraphics(options);
		
		this.object3d = new THREE.Object3D();
		
		let radius		= options.radius;
		let bbox		= new THREE.Box3();
		
		let name		= "Low_poly_UFO";
		let geometries	= payload.assets.models.ships.assets[name + ".obj"].getGeometries();
		let materials	= payload.assets.models.ships.assets[name + ".mtl"].getMaterials()
		let keys		= Object.keys(materials);
		let material	= materials[keys[0]];
		
		// Temporary, remove alpha map (for demo saucer)
		material.alphaMap = null;
		
		this.model		= new THREE.Group();
		
		geometries.forEach( geom => {
			
			let mesh	= new THREE.Mesh(geom, material);
			this.model.add(mesh);
			
		} );
		
		// Correct rotation
		this.model.rotation.x = 90 * Math.PI / 180;

		// Scale the modal to match the ships radius
		bbox.setFromObject(this.model);
		
		let scale = radius / Math.abs( Math.max(
			bbox.min.x - bbox.max.x,
			bbox.min.y - bbox.max.y,
			bbox.min.z - bbox.max.z,
		)) * 2;
		
		this.model.scale.set(scale, scale, scale);
		
		// Center model
		let container = this._makeIsometric(this.model);
		
		container.position.y	= -(bbox.min.z + bbox.max.z) / 2;
		
		// Isometric display
		this.object3d.add(container);
		
		// Set z-index
		this.zIndex = 100;
	}
	
	initLabel()
	{
		this.$label = $("<div class='player'><div class='name'></div><progress class='health'></progress></div>");
		
		this.$label.find(".name").text(this.player.name);
		this.$label.find(".health")
			.attr("max", this.world.options.ship.health)
			.val(this.health);
		
		$("#hud").append(this.$label);
	}
	
	update()
	{
		super.update();
		
		let position = this.getScreenCoordinates();
		
		this.$label.css({
			left: position.x + "px",
			top: position.y + "px"
		});
	}
	
	fire(options)
	{
		Payload.assert(!isNaN(options.degrees));
		Payload.assert(!isNaN(options.power));
		
		let radius		= 2 * this.world.options.ship.radius;
		let radians		= options.degrees * Math.PI / 180;
		let mult		= options.power / 100;
		let weapon		= new options.weapon(this.world);
		
		Payload.assert(weapon instanceof Weapon);
		
		let offset		= {
			x:			Math.cos(radians) * radius,
			y:			Math.sin(radians) * radius
		};
		
		this.world.game.taunt.generate(taunt => {
			
			let text	= new Text(this.world, {
				text: 		taunt,
				position:	{
					x: this.position.x,
					y: this.position.y + this.world.options.ship.radius * 3
				}
			});
			
			this.world.add(text);
			
			setTimeout(() => {
				
				text.remove();
				
			}, 3000);
			
			setTimeout(() => {
				
				weapon.fire({
					degrees:		options.degrees,
					power:			mult * this.world.options.projectile.launchFullPower,
					position:		{
						x:			this.position.x + offset.x,
						y:			this.position.y + offset.y
					}
				});
				
				this.trigger("fire");
				
			}, 4000);
			
		});
	}
	
	launch(options)
	{
		super.launch(options);
		
		let asset	= payload.assets.sounds.assets["521377__jarusca__rocket-launch.mp3"];
		let sound	= new Sound(this.world, {asset: asset});
		this.world.add(sound);
		
		this.trigger("launch");
	}
	
	damage(amount)
	{
		amount = Math.round(amount);
		
		this.health -= amount;
		
		let spread = 64;
		let x = (Math.random() - 0.5) * 2 * spread;
		let y = (Math.random() - 0.5) * 2 * spread;
		
		let text = new Text(this.world, {
			text:		"-" + amount,
			color:		"red",
			position: {
				x: this.position.x + x,
				y: this.position.y + y
			}
		});
		
		this.world.add(text);
		
		let $element = $("<span class='damage'><span class='inner'></span></span>");
		let $inner = $($element).find(".inner");
		
		// Update the health bar
		this.$label.find(".health").val(this.health);
	}
	
	explode()
	{
		let options = this.world.options.ship.explosion;
		
		this.state	= Ship.STATE_DEAD;
		
		this.$label.remove();
		
		super.explode(options);
	}
}

Ship.STATE_ALIVE		= "alive";
Ship.STATE_DEAD			= "dead";