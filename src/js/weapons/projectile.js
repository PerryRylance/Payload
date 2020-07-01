// requires: entities/entity.js

Payload.Projectile = function(world, options)
{
	Payload.Entity.apply(this, arguments);
}

Payload.extend(Payload.Projectile, Payload.Entity);
