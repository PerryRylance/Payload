import EventDispatcherWithOptions from "../EventDispatcherWithOptions";
import Compass from "./entities/Compass";

export default class UI extends EventDispatcherWithOptions
{
	constructor(game, options)
	{
		super(options);
		
		this.game = game;
		
		this.initWeaponSelect();
		this.initCompass();
		
		$("#re-center").on("click", (event) => this.onReCenter(event));
		$("#launch").on("click", (event) => this.onLaunch(event));
		$("#fire").on("click", (event) => this.onFire(event));
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
			
			let radians = $(event.target).val() * Math.PI / 180;
			this.compass.angle = radians;
			
		});
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
	
	onLaunch(event)
	{
		let ship		= this.game.currentPlayer.ship;
		let degrees		= $("input[name='degrees']").val();
		let mult		= $("input[name='power']").val() / 100;
		let power		= mult * this.game.world.options.ship.launchFullPower;
		
		ship.launch({
			degrees:	degrees,
			power:		power
		});
		
		// TODO: Lock controls, wait for ship to become stationary
	}
	
	onFire(event)
	{
		// NB: Repeated
		let ship		= this.game.currentPlayer.ship;
		let degrees		= $("input[name='degrees']").val();
		let radians		= degrees * Math.PI / 180;
		
		let mult		= $("input[name='power']").val() / 100;
		let power		= mult * this.game.world.options.ship.launchFullPower;
		let constructor	= this.getSelectedWeapon();
		let radius		= 4 * this.game.world.options.ship.radius;
		
		let offset		= {
			x:			Math.cos(radians) * radius,
			y:			Math.sin(radians) * radius
		};
		
		let position	= {
			x:			ship.object3d.position.x + offset.x,
			y:			ship.object3d.position.y + offset.y
		};
		
		let weapon		= new constructor(this.game.world);
		
		weapon.fire({
			degrees:		degrees,
			power:			mult * this.game.world.options.projectile.launchFullPower,
			position:		position
		});
		
		// TODO: Listen for weapon complete event
	}
}