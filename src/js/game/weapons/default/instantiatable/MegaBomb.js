import Bomb from "../Bomb";

export default class MegaBomb extends Bomb
{
	constructor()
	{
		super();
	}
	
	get radius()
	{
		return 60;
	}
	
	get damage()
	{
		return 160;
	}
}