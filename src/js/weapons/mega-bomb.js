// requires: weapons/bomb.js

Payload.Weapon.MegaBomb = function(world)
{
	Payload.Bomb.apply(this, arguments);
	
	this.damage = 60;
	this.radius = 160;
}

Payload.extend(Payload.Weapon.MegaBomb, Payload.Bomb);

Payload.Weapon.MegaBomb.COST	= 60;