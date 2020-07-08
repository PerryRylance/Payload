// requires: weapons/bomb.js

Payload.Weapon.SmallBomb = function(world)
{
	Payload.Bomb.apply(this, arguments);
	
	this.damage = 10;
	this.radius = 50;
}

Payload.extend(Payload.Weapon.SmallBomb, Payload.Bomb);

Payload.Weapon.SmallBomb.COST	= 0;