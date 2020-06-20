// requires: entities/entity.js

Payload.Ship = function()
{
	Payload.Entity.apply(this, arguments);
}

Payload.extend(Payload.Ship, Payload.Entity);
