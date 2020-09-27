import Disruptor from "../Disruptor";

export default class SmallDisruptor extends Disruptor
{
	constructor(world)
	{
		super(world);
	}
	
	get radius()
	{
		return 5;
	}
	
	get damage()
	{
		return 15;
	}
}