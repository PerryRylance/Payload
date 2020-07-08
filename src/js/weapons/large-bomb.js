// requires: weapons/bomb.js

Payload.Weapon.LargeBomb = function(world)
{
	Payload.Bomb.apply(this, arguments);
	
	this.damage = 40;
	this.radius = 120;
}

Payload.extend(Payload.Weapon.LargeBomb, Payload.Bomb);

Payload.Weapon.LargeBomb.COST	= 30;