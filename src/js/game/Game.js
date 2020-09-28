import EventDispatcherWithOptions from "../EventDispatcherWithOptions";
import Player from "./Player";
import World from "./World";
import UI from "./UI";
import Announcer from "./Announcer";
import Weapon from "./weapons/default/Weapon";
import Taunt from "./Taunt";

export default class Game extends EventDispatcherWithOptions
{
	constructor(options)
	{
		super(options);
		
		this.players		= [];
		this.currentPlayer	= null;
		
		this._status		= Game.STATUS_LOBBY;
		this.taunt			= new Taunt();
	}
	
	get status()
	{
		return this._status;
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
		this.on("launch fire", event => this.onPlayerAction(event));
		
		var index		= Math.floor(this.random() * this.players.length);
		this.startTurn(this.players[index]);
	}
	
	startTurn(player)
	{
		Payload.assert(player instanceof Player);
		
		this.currentPlayer = player;
		this.ui.enabled = true;
		
		this._status = Game.STATUS_WAITING_FOR_ACTION;
		
		console.log("Turn started for " + player.name);
		
		this.trigger({
			type:	"turnstart",
			player: player
		});
	}
	
	onPlayerAction(event)
	{
		this.ui.enabled = false;
		
		console.log("Detected player action");
		
		if(event.type == "fire")
		{
			console.log("Waiting for weapon to complete");
			
			this._status = Game.STATUS_WAITING_FOR_WEAPON;
			
			this.on("complete", event => { this.onWeaponComplete(event) });
		}
		else
		{
			console.log("Waiting for world to come to a rest");
			
			this._status = Game.STATUS_WAITING_FOR_RESTING;
			
			this.on("resting", event => { this.onWorldResting(event) });
		}
	}
	
	onWeaponComplete(event)
	{
		if(!(event.target instanceof Weapon))
			return;
		
		console.log("Weapon completed, waiting for world to come to a rest");
		
		this.off("complete");
		
		if(!this.world.isAtRest)
		{
			this._status = Game.STATUS_WAITING_FOR_RESTING;
			
			this.on("resting", event => { this.onWorldResting(event) });
		}
		else
			this.endTurn();
	}
	
	onWorldResting(event)
	{
		if(event && !(event.target instanceof World))
			return;
		
		console.log("World has come to a rest, ending turn");
		
		this.off("resting");
		
		this.endTurn();
	}
	
	endTurn()
	{
		Payload.assert(this.currentPlayer != null);
		
		console.log("Turn ended for " + this.currentPlayer.name);
		
		this.trigger({
			type:	"turnend",
			player: this.currentPlayer
		});
		
		var currentPlayerIndex = this.players.indexOf(this.currentPlayer);
		
		Payload.assert(currentPlayerIndex > -1);
		
		var nextIndex = (++currentPlayerIndex % this.players.length);
		
		this._status = Game.STATUS_BETWEEN_TURNS;
		
		setTimeout(() => {
			this.startTurn(this.players[nextIndex]);
		}, 2000);
	}
	
	end()
	{
		this.trigger("gameend");
	}
}

Game.STATUS_LOBBY					= "lobby";
Game.STATUS_WAITING_FOR_ACTION		= "waiting-for-action";
Game.STATUS_WAITING_FOR_WEAPON		= "waiting-for-weapon";
Game.STATUS_WAITING_FOR_RESTING		= "waiting-for-resting";
Game.STATUS_BETWEEN_TURNS			= "between-turns";
Game.STATUS_ENDED					= "ended";