import Bomb from "../Bomb";

export default class MediumBomb extends Bomb
{
	constructor(world)
	{
		super(world);
	}
	
	get radius()
	{
		return 100;
	}
	
	get damage()
	{
		return 15;
	}
}