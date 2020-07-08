// requires: events/event-dispatcher.js

Payload.Player = function(options)
{
	Payload.EventDispatcher.call(this);
	
	if(!options)
		options = {};
	
	for(var name in options)
		this[name] = options;
}

Payload.extend(Payload.Player, Payload.EventDispatcher);
