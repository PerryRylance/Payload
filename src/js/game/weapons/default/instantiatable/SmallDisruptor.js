import Disruptor from "../Disruptor";

export default class SmallDisruptor extends Disruptor
{
	constructor(world)
	{
		super(world);
	}
	
	get radius()
	{
		return 20;
	}
	
	get damage()
	{
		return 15;
	}
}