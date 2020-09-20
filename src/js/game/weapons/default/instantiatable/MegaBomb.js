import Bomb from "../Bomb";

export default class MegaBomb extends Bomb
{
	constructor(world)
	{
		super(world);
	}
	
	get radius()
	{
		return 300;
	}
	
	get damage()
	{
		return 160;
	}
}