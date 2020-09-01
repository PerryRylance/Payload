import EventDispatcherWithOptions from "../EventDispatcherWithOptions";
import Player from "./Player";
import World from "./World";
import UI from "./UI";

export default class Game extends EventDispatcherWithOptions
{
	constructor(options)
	{
		super(options);
		
		this.players		= [];
		this.currentPlayer	= null;
		
		this.status			= Game.STATUS_LOBBY;
		
		// NB: Put this in the UI module
		// this.weaponSelect	= new WeaponSelect($("select.weapon"))
		// $("menu#actions button").on("click",  function(event) {
			// self.onActionButtonClicked(event);
		// });
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
		this.seed		= 123;
		
		this.random		= PRNG.Alea(this.seed);
		this.world		= new World(this);
		
		this.weapons	= Payload.weapons["default"];
		this.ui			= new UI(this);
		
		var index		= Math.floor(this.random() * this.players.length);
		this.startTurn(this.players[index]);
	}
	
	startTurn(player)
	{
		Payload.assert(player instanceof Player);
		
		this.currentPlayer = player;
	}
	
	endTurn()
	{
		Payload.assert(this.currentPlayer != null);
		
		var currentPlayerIndex = this.players.indexOf(this.currentPlayer);
		
		Payload.assert(currentPlayerIndex > -1);
		
		var nextIndex = (currentPlayerIndex++ % this.players.length);
		
		this.startTurn(this.players[nextIndex]);
	}
	
	end()
	{
		
	}
}

Game.STATUS_LOBBY		= "lobby";
Game.STATUS_PLAYING		= "playing";
Game.STATUS_ENDED		= "ended";