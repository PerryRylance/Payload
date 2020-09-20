import EventDispatcherWithOptions from "../EventDispatcherWithOptions";

export default class Player extends EventDispatcherWithOptions
{
	constructor(options)
	{
		super(options);
		
		this.name = "Unnamed Player";
	}
}