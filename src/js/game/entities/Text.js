import Entity from "./Entity";

import SpriteText from "three-spritetext";

export default class Text extends Entity
{
	constructor(world, options)
	{
		super(world, options);
	}
	
	initGraphics(options)
	{
		options = $.extend({
			
			fontFace:		"pixeled",
			padding:		16,
			strokeWidth:	3,
			strokeColor:	"black"
			
		}, options);
		
		this.object3d = new SpriteText(options.text);
		
		for(var key in options)
		{
			if(key == "position")
				continue;
			
			this.object3d[key] = options[key];
		}
		
		super.initGraphics(options);
		
		this.zIndex = 210; // Just above particle emitters
	}
}