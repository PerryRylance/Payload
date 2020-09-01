import Bomb from "../Bomb";

export default class SmallBomb extends Bomb
{
	constructor()
	{
		super();
	}
	
	get radius()
	{
		return 50;
	}
	
	get damage()
	{
		return 10;
	}
}