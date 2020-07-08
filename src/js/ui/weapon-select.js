// requires: core.js
	
Payload.WeaponSelect = function($element)
{
	this.$element = $element;
	this.$element.html("");
	
	for(var name in Payload.Weapon)
	{
		var $option	= $("<option></option>");
		var cost;
		
		if(Payload.Weapon[name].COST !== undefined)
			cost	= Payload.Weapon[name].COST;
		else
		{
			console.warn("Payload.Weapon." + name + " has no COST");
			cost	= 0;
		}
		
		var caption	= name.replace(/([A-Z])/g, " $1").trim(" ") + " (" + cost + ")";
		
		$option.attr("value", name);
		$option.text(caption);
		
		$($element).append($option);
	}
}