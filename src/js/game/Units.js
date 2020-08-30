const Units = {
	
	RATIO: 20,
	
	physicsToGraphics: function(x) {
		return x * Units.PHYSICS_TO_GRAPHICS;
	},
	
	graphicsToPhysics: function(x) {
		return x * Units.GRAPHICS_TO_PHYSICS;
	}
	
};

Units.GRAPHICS_TO_PHYSICS		= 1 / Units.RATIO;
Units.PHYSICS_TO_GRAPHICS		= Units.RATIO;

Units.p2g = Units.physicsToGraphics;
Units.g2p = Units.graphicsToPhysics;

export default Units;