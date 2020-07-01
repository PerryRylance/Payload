// requires: entities/entity.js

Payload.Weapon = function(world)
{
	Payload.Entity.apply(this, arguments);
}

Payload.extend(Payload.Weapon, Payload.Entity);

Payload.Weapon.prototype.fire = function()
{
	
}
