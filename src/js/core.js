window.Payload = function()
{
	window.stats = new Stats();
	stats.showPanel(0);
	stats.domElement.style.zIndex = 999;
	stats.domElement.style.position = "fixed";
	document.body.appendChild(stats.domElement);
	
	window.Box2D = Box2D({
		TOTAL_MEMORY: Payload.BOX2D_MEMORY_MB * 1048576
	});
	
	CameraControls.install({
		THREE: window.THREE
	});
}

Payload.BOX2D_MEMORY_MB		= 256;

Payload.extend = function(child, parent)
{
	child.prototype = Object.create(parent.prototype);
	child.prototype.constructor = child;
}

Payload.assert = function(condition, failure)
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

Payload.prototype.init = function()
{
	var self = this;
	
	$("dialog.loading").attr("open", "open");
	
	this.assets = new Payload.Assets();
	this.assets.on("load", function(event) {
		
		$("dialog.loading").removeAttr("open");
		
		// Temp code, just start up a game here
		self.player = new Payload.Player({
			"name": "Pez"
		});
		
		self.game = new Payload.Game();
		self.game.addPlayer(self.player);
		self.game.start();
		
	});
	this.assets.load();
}
