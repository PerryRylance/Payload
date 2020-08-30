import EventDispatcher from "@perry-rylance/event-dispatcher";

export default class EventDispatcherWithOptions extends EventDispatcher
{
	constructor(options)
	{
		super();
		
		if(!options)
			options = [];
		
		for(var key in options)
			this[key] = options[key];
	}
}