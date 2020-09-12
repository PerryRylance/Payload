import Bomb from "../Bomb";

export default class LargeBomb extends Bomb
{
	constructor(world)
	{
		super(world);
	}
	
	get radius()
	{
		return 120;
	}
	
	get damage()
	{
		return 40;
	}
}