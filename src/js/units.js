// require: core.js

Payload.Units = {
	
	RATIO: 20,
	
	physicsToGraphics: function(x) {
		return x * Payload.Units.GRAPHICS_TO_PHYSICS;
	},
	
	graphicsToPhysics: function(x) {
		return x * Payload.Units.PHYSICS_TO_GRAPHICS;
	}
	
};

Payload.Units.GRAPHICS_TO_PHYSICS		= 1 / Payload.Units.RATIO;
Payload.Units.PHYSICS_TO_GRAPHICS		= Payload.Units.RATIO;

Payload.Units.p2g = Payload.Units.physicsToGraphics;
Payload.Units.g2p = Payload.Units.graphicsToPhysics;
