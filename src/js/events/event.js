// requires: core.js
		
/**
 * Base class used for events (for non-HTMLElement objects)
 * @module Payload.Event
 * @memberof Payload
 * @param {string|object} options The event type as a string, or an object of options to be mapped to this event
 */
Payload.Event = function(options)
{
	if(typeof options == "string")
		this.type = options;
	
	this.bubbles		= true;
	this.cancelable		= true;
	this.phase			= Payload.Event.PHASE_CAPTURE;
	this.target			= null;
	
	this._cancelled = false;
	
	if(typeof options == "object")
		for(var name in options)
			this[name] = options[name];
}

Payload.Event.CAPTURING_PHASE		= 0;
Payload.Event.AT_TARGET				= 1;
Payload.Event.BUBBLING_PHASE		= 2;

/**
 * Prevents any further propagation of this event
 * @method
 * @memberof Payload.Event
 */
Payload.Event.prototype.stopPropagation = function()
{
	this._cancelled = true;
}
