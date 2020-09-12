import Bomb from "../Bomb";

export default class MediumBomb extends Bomb
{
	constructor(world)
	{
		super(world);
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