import Bomb from "../Bomb";

export default class LargeBomb extends Bomb
{
	constructor(world)
	{
		super(world);
	}
	
	get radius()
	{
		return 200;
	}
	
	get damage()
	{
		return 40;
	}
}