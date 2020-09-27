import Disruptor from "../Disruptor";

export default class MediumDisruptor extends Disruptor
{
	constructor(world)
	{
		super(world);
	}
	
	get radius()
	{
		return 10;
	}
	
	get damage()
	{
		return 30;
	}
}