// requires: weapons/weapon.js

Payload.Bomb = function(world)
{
	Payload.Weapon.apply(this, arguments);
}

Payload.extend(Payload.Bomb, Payload.Weapon);

Payload.Bomb.prototype.fire = function(options)
{
	var self = this;
	
	// Create a new projectile at the specified position
	var projectile = new Payload.Projectile(options);
	
	// Collision listener for this projectile
	projectile.on("collision", function(event) {
		
		// Bang!
		projectile.detonate({
			damage: 5,
			radius: 50
		});
		
		// Let the game know this weapon is finished so the turn can end
		self.trigger("complete");
		
	});
	
	// Launch the projectile and the specified angle and power
	projectile.launch(options);
}
