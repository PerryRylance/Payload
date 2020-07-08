// requires: weapons/bomb.js

Payload.Weapon.MediumBomb = function(world)
{
	Payload.Bomb.apply(this, arguments);
	
	this.damage = 15;
	this.radius = 80;
}

Payload.extend(Payload.Weapon.MediumBomb, Payload.Bomb);

Payload.Weapon.MediumBomb.COST	= 10;