import EventDispatcher from "@perry-rylance/event-dispatcher";

export default class Weapon extends EventDispatcher
{
	constructor()
	{
		super();
	}
	
	fire(options)
	{
		throw new Error("Abstract method called");
	}
}