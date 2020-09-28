import EventDispatcherWithOptions from "../EventDispatcherWithOptions";
import Compass from "./entities/Compass";
import Text from "./entities/Text";

export default class UI extends EventDispatcherWithOptions
{
	constructor(game, options)
	{
		super(options);
		
		this.game = game;
		
		this._enabled = true;
		
		this.initWeaponSelect();
		this.initCompass();
		
		$("#re-center").on("click", event => this.onReCenter(event));
		$("#launch").on("click", event => this.onLaunch(event));
		$("#fire").on("click", event => this.onFire(event));
		$("#skip-turn").on("click", event => this.onSkipTurn(event));
		
		game.on("turnstart", event => this.onTurnStart(event));
	}
	
	get enabled()
	{
		return this._enabled;
	}
	
	set enabled(value)
	{
		this._enabled = value ? true : false;
		
		$("#hud .player-controls :input").prop("disabled", !this.enabled);
		$("#hud .player-controls").toggleClass("disabled", !this.enabled);
		
		this.compass.object3d.visible = this.enabled;
	}
	
	remember()
	{
		let player		= this.game.currentPlayer;
		let settings	= {};
		
		$("#hud .player-controls input, #hud .player-controls select").each((index, el) => {
			settings[$(el).attr("name")] = $(el).val();
		});
		
		player.lastUISettings = settings;
	}
	
	recall()
	{
		let player		= this.game.currentPlayer;
		let settings	= player.lastUISettings;
		
		if(!settings)
			return;
		
		for(var name in settings)
			$("#hud .player-controls [name='" + name + "']").val(settings[name]);
		
		this.updateCompass();
	}
	
	initWeaponSelect()
	{
		var $select = $("menu#weapons select");
		
		$select.empty();
		
		this.game.weapons.definitions.forEach( (definition) => {
			
			var $option = $("<option></option>");
			
			$option.data("payloadWeaponClass", definition["class"]);
			$option.text(definition.name + " (" + definition.cost + ")");
			
			$select.append($option);
			
		} );
	}
	
	initCompass()
	{
		this.compass = new Compass(this.game.world);
		
		this.game.world.add(this.compass);
		
		$("input[name='degrees']").on("input", (event) => {
			this.updateCompass();
		});
	}
	
	updateCompass()
	{
		let radians = $("input[name='degrees']").val() * Math.PI / 180;
		this.compass.angle = radians;
	}
	
	getSelectedWeapon()
	{
		var $option = $("menu#weapons select > option:selected");
		var weapon = $option.data("payloadWeaponClass");
		
		return weapon;
	}
	
	onReCenter(event)
	{
		let ship		= this.game.currentPlayer.ship;
		let camera		= this.game.world.interaction.camera;
		let controls	= this.game.world.interaction.controls;
		
		controls.moveTo(ship.position.x, ship.position.y, camera.z, true);
		controls.zoomTo(1, true);
	}
	
	onTurnStart(event)
	{
		this.onReCenter(event);
		this.recall();
	}
	
	onLaunch(event)
	{
		let ship		= this.game.currentPlayer.ship;
		let degrees		= $("input[name='degrees']").val();
		let mult		= $("input[name='power']").val() / 100;
		let power		= mult * this.game.world.options.ship.launchFullPower;
		
		this.remember();
		this.enabled	= false;
		
		ship.launch({
			degrees:	degrees,
			power:		power
		});
		
		// TODO: Lock controls, wait for ship to become stationary
	}
	
	onFire(event)
	{
		// TODO: Consider delegating a lot of this to the Ship module instead
		
		this.onReCenter(event);
		
		let ship		= this.game.currentPlayer.ship;
		let degrees		= $("input[name='degrees']").val();
		let radians		= degrees * Math.PI / 180;
		
		let mult		= $("input[name='power']").val() / 100;
		let power		= mult * this.game.world.options.ship.launchFullPower;
		let constructor	= this.getSelectedWeapon();
		let radius		= 2 * this.game.world.options.ship.radius;
		
		let offset		= {
			x:			Math.cos(radians) * radius,
			y:			Math.sin(radians) * radius
		};
		
		let position	= {
			x:			ship.object3d.position.x + offset.x,
			y:			ship.object3d.position.y + offset.y
		};
		
		let weapon		= new constructor(this.game.world);
		
		this.remember();
		this.enabled	= false;
		
		this.game.taunt.generate(taunt => {
			
			let text	= new Text(this.game.world, {
				text: 		taunt,
				position:	{
					x: ship.position.x,
					y: ship.position.y + this.game.world.options.ship.radius * 3
				}
			});
			
			this.game.world.add(text);
			
			setTimeout(() => {
				
				text.remove();
				
			}, 3000);
			
			setTimeout(() => {
				
				weapon.fire({
					degrees:		degrees,
					power:			mult * this.game.world.options.projectile.launchFullPower,
					position:		position
				});
				
				ship.trigger("fire");
				
			}, 4000);
			
		});
	}
	
	onSkipTurn(event)
	{
		this.enabled = false;
		
		this.game.endTurn();
	}
}