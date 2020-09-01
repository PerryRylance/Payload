import EventDispatcherWithOptions from "../EventDispatcherWithOptions";

export default class UI extends EventDispatcherWithOptions
{
	constructor(game, options)
	{
		super(options);
		
		this.game = game;
		
		this.initWeaponSelect();
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
}