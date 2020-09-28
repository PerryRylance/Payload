import EventDispatcher from "@perry-rylance/event-dispatcher";

export default class Weapon extends EventDispatcher
{
	constructor(world)
	{
		super();
		
		this.world	= world;
		this.parent	= world; // For event bubbling
	}
	
	fire(options)
	{
		throw new Error("Abstract method called");
	}
}