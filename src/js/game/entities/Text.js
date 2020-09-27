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
		
		this.zIndex = 190; // Just above particle emitters
	}
	
	update()
	{
		let camera		= this.world.camera;
		let oneOverZoom	= 1 / camera.zoom;
		let size		= 64;
		let scale		= oneOverZoom * size;
		
		this.object3d.scale.set(scale, scale, 1);
	}
}