// requires: events/event-dispatcher.js

/**
 * @module Payload.Game
 * Handles rules, turns, etc.
 */

Payload.Game = function()
{
	var self			= this;
		
	Payload.EventDispatcher.call(this);
	
	this.players		= [];
	this.currentPlayer	= null;
	this.status			= Payload.Game.STATUS_LOBBY;
	
	this.weaponSelect = new Payload.WeaponSelect( $("select.weapon") );
	
	$("menu#actions button").on("click",  function(event) {
		self.onActionButtonClicked(event);
	});
}

Payload.extend(Payload.Game, Payload.EventDispatcher);

Payload.Game.STATUS_LOBBY		= "lobby";
Payload.Game.STATUS_PLAYING		= "playing";
Payload.Game.STATUS_ENDED		= "ended";

Payload.Game.prototype.onActionButtonClicked = function(event)
{
	var action = event.target.id;
	
	switch(action)
	{
		case "fire":
			break;
			
		case "launch":
			break;
			
		case "re-center":
			break;
			
		case "skip-turn":
			break;
			
		case "surrender":
			break;
		
		default:
			throw new Error("Unknown action");
			break;
	}
}

Payload.Game.prototype.addPlayer = function(player)
{
	this.players.push(player);
	player.game = this;
}

Payload.Game.prototype.start = function()
{
	Payload.assert(this.players.length ? true : false);
	
	this.world = new Payload.World(this);
	
	var index = Math.floor(Math.random() * this.players.length);
	this.startTurn(this.players[index]);
}

Payload.Game.prototype.startTurn = function(player)
{
	Payload.assert(player instanceof Payload.Player);
	
	this.currentPlayer = player;
}

Payload.Game.prototype.endTurn = function()
{
	Payload.assert(this.currentPlayer != null);
	
	var currentPlayerIndex = this.players.indexOf(this.currentPlayer);
	
	Payload.assert(currentPlayerIndex > -1);
	
	var nextIndex = (currentPlayerIndex++ % this.players.length);
	
	this.startTurn(this.players[nextIndex]);
}

Payload.Game.prototype.end = function()
{
	
}