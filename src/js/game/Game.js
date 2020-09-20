import EventDispatcherWithOptions from "../EventDispatcherWithOptions";
import Player from "./Player";
import World from "./World";
import UI from "./UI";
import Announcer from "./Announcer";

export default class Game extends EventDispatcherWithOptions
{
	constructor(options)
	{
		super(options);
		
		this.players		= [];
		this.currentPlayer	= null;
		
		this.status			= Game.STATUS_LOBBY;
	}
	
	addPlayer(player)
	{
		Payload.assert(player instanceof Player);
		
		this.players.push(player);
		player.game = this;
	}
	
	start()
	{
		Payload.assert(this.players.length ? true : false);
		
		this.seed		= new Date().getTime();
		
		this.random		= PRNG.Alea(this.seed);
		this.world		= new World(this);
		
		this.weapons	= Payload.weapons["default"];
		this.ui			= new UI(this);
		
		this.announcer	= new Announcer(this);
		
		// Set the world turning!
		this.world.step();
		
		this.trigger("gamestart");
		
		var index		= Math.floor(this.random() * this.players.length);
		this.startTurn(this.players[index]);
	}
	
	startTurn(player)
	{
		Payload.assert(player instanceof Player);
		
		this.currentPlayer = player;
		
		this.trigger({
			type:	"turnstart",
			player: player
		});
	}
	
	endTurn()
	{
		Payload.assert(this.currentPlayer != null);
		
		this.trigger({
			type:	"turnend",
			player: this.currentPlayer
		});
		
		var currentPlayerIndex = this.players.indexOf(this.currentPlayer);
		
		Payload.assert(currentPlayerIndex > -1);
		
		var nextIndex = (currentPlayerIndex++ % this.players.length);
		
		this.startTurn(this.players[nextIndex]);
	}
	
	end()
	{
		this.trigger("gameend");
	}
}

Game.STATUS_LOBBY		= "lobby";
Game.STATUS_PLAYING		= "playing";
Game.STATUS_ENDED		= "ended";