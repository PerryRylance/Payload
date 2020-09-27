import Disruptor from "../Disruptor";

export default class LargeDisruptor extends Disruptor
{
	constructor(world)
	{
		super(world);
	}
	
	get radius()
	{
		return 15;
	}
	
	get damage()
	{
		return 50;
	}
}