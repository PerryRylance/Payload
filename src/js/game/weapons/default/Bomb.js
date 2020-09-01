import Weapon from "./Weapon";

export default class Bomb extends Weapon
{
	constructor()
	{
		super();
	}
	
	fire()
	{
		alert("Firing");
	}
}