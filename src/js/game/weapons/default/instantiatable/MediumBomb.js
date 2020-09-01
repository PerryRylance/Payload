import Bomb from "../Bomb";

export default class MediumBomb extends Bomb
{
	constructor()
	{
		super();
	}
	
	get radius()
	{
		return 80;
	}
	
	get damage()
	{
		return 15;
	}
}