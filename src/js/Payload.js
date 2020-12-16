import * as THREE from "three";
import Stats from "stats.js";
import CameraControls from "camera-controls";

import Assets from "./assets/Assets";
import Player from "./game/Player";
import Game from "./game/Game";
import DefaultWeaponSet from "./game/weapons/default/Set";

import AI from "./game/ai/AI";

export default class Payload
{
	constructor()
	{
		window.stats = new Stats();
		stats.showPanel(0);
		stats.domElement.style.zIndex = 999;
		stats.domElement.style.position = "fixed";
		document.body.appendChild(stats.domElement);
		
		window.Box2D = new Box2D({
			TOTAL_MEMORY: Payload.BOX2D_MEMORY_MB * 1048576
		});
		
		window.THREE = THREE;
		
		CameraControls.install({THREE: THREE});
	}
	
	static assert(condition, failure)
	{
		if(condition === true)
			return;
		
		if(condition === false)
		{
			if(!failure)
				throw new Error("Assertion failed");
			
			throw new Error(failure);
		}
		
		throw new Error("Invalid assertion");
	}
	
	init()
	{
		var self = this;
		
		$("dialog.loading").attr("open", "open");
		
		this.assets = new Assets();
		this.assets.on("load", (event) => this.onAssetsLoaded(event));
		this.assets.load();
	}
	
	onAssetsLoaded(event)
	{
		$("dialog.loading").removeAttr("open");
		
		// Temp code, just start up a game here
		this.player = new Player({
			name:	"Pez"
		});
		
		this.game = new Game();
		
		this.game.addPlayer(this.player);
		
		for(var i = 1; i <= 5; i++)
			this.game.addPlayer(new Player({
				name:	"Computer " + i,
				ai:		new AI(this.game)
			}));
		
		this.game.start();
	}
}

Payload.BOX2D_MEMORY_MB = 512;

Payload.createInstance = function()
{
	return new Payload();
}

Payload.weapons = {
	"default": DefaultWeaponSet
};

window.Payload = Payload;
window.payload = Payload.createInstance();

$(window).on("load", function(event) {
	payload.init();
});