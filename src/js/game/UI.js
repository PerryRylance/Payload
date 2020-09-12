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
}