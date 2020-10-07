import EventDispatcherWithOptions from "../EventDispatcherWithOptions";

export default class Player extends EventDispatcherWithOptions
{
	constructor(options)
	{
		if(!options)
			options = {};
		
		super(options);
		
		this.name = "Unnamed Player";
		
		if(options.name)
			this.name = options.name;
		
		if(options.ai)
			options.ai.player = this;
	}
	
	
}