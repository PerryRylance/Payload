import EventDispatcherWithOptions from "../EventDispatcherWithOptions";
import Player from "./Player";
import World from "./World";
import UI from "./UI";
import Announcer from "./Announcer";
import Weapon from "./weapons/default/Weapon";
import Taunt from "./Taunt";
import Text from "./entities/Text";
import Ship from "./entities/Ship";

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
	
	get numAliveShips()
	{
		let result = 0;
		
		this.world.ships.forEach(ship => {
			
			if(ship.state == Ship.STATE_ALIVE)
				result++;
			
		})
		
		return result;
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
		
		// console.log("Turn started for " + player.name);
		
		this.trigger({
			type:	"turnstart",
			player: player
		});
	}
	
	onPlayerAction(event)
	{
		this.ui.enabled = false;
		
		// console.log("Detected player action");
		
		if(event.type == "fire")
		{
			// console.log("Waiting for weapon to complete");
			
			this._status = Game.STATUS_WAITING_FOR_WEAPON;
			
			this.on("complete", event => { this.onWeaponComplete(event) });
		}
		else
		{
			// console.log("Waiting for world to come to a rest");
			
			this._status = Game.STATUS_WAITING_FOR_RESTING;
			
			this.on("resting", event => { this.onWorldResting(event) });
		}
	}
	
	onWeaponComplete(event)
	{
		if(!(event.target instanceof Weapon))
			return;
		
		// console.log("Weapon completed, waiting for world to come to a rest");
		
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
		
		// console.log("World has come to a rest, ending turn");
		
		this.off("resting");
		
		this.endTurn();
	}
	
	handleDeadShips(callback)
	{
		let self	= this;
		let ships	= [];
		
		this.world.ships.forEach(entity => {
			if(entity.health <= 0)
				ships.push(entity);
		});
		
		if(ships.length == 0)
		{
			callback();
			return;
		}
		
		function explodeNextShip()
		{
			let ship		= ships.shift();
			
			ship.center();
			
			// TODO: Refactor, this is repeated from UI
			self.taunt.generate(taunt => {
				
				let text	= new Text(self.world, {
					text: 		taunt,
					position:	{
						x: ship.position.x,
						y: ship.position.y + self.world.options.ship.radius * 3
					}
				});
				
				self.world.add(text);
				
				setTimeout(() => {
					text.remove();
				}, 3000);
				
				setTimeout(() => {
					ship.explode();
				}, 4000);
				
				setTimeout(() => {
					
					if(ships.length > 0)
						explodeNextShip();
					else
						callback();
					
				}, 6000);
				
			});
		}
		
		explodeNextShip();
	}
	
	getNextPlayer()
	{
		Payload.assert(this.numAliveShips > 0 ? true : false);
		
		let currentPlayerIndex = this.players.indexOf(this.currentPlayer);
		
		Payload.assert(currentPlayerIndex > -1);
		
		for(
			let nextIndex = (currentPlayerIndex + 1) % this.players.length; 
			nextIndex != currentPlayerIndex; 
			nextIndex = (nextIndex + 1) % this.players.length
			)
		{
			if(this.players[nextIndex].ship.state == Ship.STATE_ALIVE)
				return this.players[nextIndex];
		}
	}
	
	getAliveShips()
	{
		let result = [];
		
		this.world.ships.forEach(ship => {
			
			if(ship.state == Ship.STATE_ALIVE)
				result.push(ship);
			
		});
		
		return result;
	}
	
	endTurn()
	{
		Payload.assert(this.currentPlayer != null);
		
		// console.log("Turn ended for " + this.currentPlayer.name);
		
		this.handleDeadShips(() => {
			
			this.trigger({
				type:	"turnend",
				player: this.currentPlayer
			});
			
			let numAliveShips = this.numAliveShips;
			
			if(numAliveShips > 1)
			{
				this._status = Game.STATUS_BETWEEN_TURNS;
				
				let nextPlayer = this.getNextPlayer();
				
				setTimeout(() => {
					
					this.startTurn(nextPlayer);
					
					if(numAliveShips == 1)
						this.end();
					
				}, 2000);
			}
			else
				this.end();
			
		});
	}
	
	end()
	{
		this._status = Game.STATUS_ENDED;
		
		if(this.numAliveShips == 0)
			this.announcer.announce("Draw");
		else if(this.numAliveShips == 1)
		{
			let ship = this.getAliveShips()[0];
			ship.center();
			
			this.announcer.announce("Victory");
		}
		
		this.trigger("gameend");
	}
}

Game.STATUS_LOBBY					= "lobby";
Game.STATUS_WAITING_FOR_ACTION		= "waiting-for-action";
Game.STATUS_WAITING_FOR_WEAPON		= "waiting-for-weapon";
Game.STATUS_WAITING_FOR_RESTING		= "waiting-for-resting";
Game.STATUS_BETWEEN_TURNS			= "between-turns";
Game.STATUS_ENDED					= "ended";

Game.RESULT_VICTORY					= "victory";
Game.RESULT_DRAW					= "draw";