import EventDispatcherWithOptions from "../../EventDispatcherWithOptions";
import Tracer from "../entities/weapons/Tracer";

export default class AI extends EventDispatcherWithOptions
{
	constructor(game, options)
	{
		super(options);
		
		this.game = game;
		
		this.game.on("turnstart", event => {
			
			if(event.player === this.player)
				this.onTurnStart(event);
			
		});
	}
	
	onTurnStart(event)
	{
		this.state = {
			numTracers:		360,
			minAngle:		0,
			maxAngle:		360
		};
		
		this.predict();
	}
	
	predict()
	{
		let world					= this.game.world;
				
		let count					= this.state.numTracers;
		let startAngle				= this.state.minAngle;
		let incrementAngle			= (this.state.maxAngle - this.state.minAngle) / count;
				
		this.activeTracers			= [];
		this.tracersAndDistances	= [];
		
		for(var i = 0; i < count; i++)
		{
			let options		= {
				degrees:	startAngle + (i * incrementAngle),
				power:		world.options.projectile.launchFullPower
			};
			
			options.position = this.player.ship.getProjectileOrigin(options);
			
			let tracer		= new Tracer(this.game.world);
			
			tracer.degrees	= options.degrees;
			tracer.power	= 100;
			
			tracer.once("completed", event => {
				this.onTracerCompleted(event);
			});
			
			this.activeTracers.push(tracer);
			
			world.add(tracer);
			tracer.launch(options);
			
		}
	}
	
	onTracerCompleted(event)
	{
		let tracer		= event.target;
		let points		= tracer.points;
		let threshold	= this.game.world.options.ship.radius * 4;
		let index		= this.activeTracers.indexOf(tracer);
		
		this.activeTracers.splice(index, 1);
		tracer.remove();
		
		if(points.length > 0)
		{
			let end		= points[points.length - 1];
			let results	= this.getShipsAndDistances(end);
			let best	= results[0];
			
			this.tracersAndDistances.push({
				distance:	best.distance,
				tracer:		tracer
			});
			
			if(best.distance <= threshold && this.activeTracers.length > 0)
			{
				this.onAllTracersCompleted();
				return;
			}
		}
		
		console.log(this.activeTracers.length + " active tracers remaining");
		
		if(this.activeTracers.length == 0)
			this.onAllTracersCompleted();
	}
	
	onAllTracersCompleted()
	{
		let best;
		
		for(let i = this.activeTracers.length - 1; i >= 0; i--)
			this.activeTracers[i].remove();
		
		this.activeTracers = [];
		
		this.tracersAndDistances.sort(function(a, b) {
			return (a.distance < b.distance ? -1 : 1);
		});
		
		best = this.tracersAndDistances[0];
		
		$("input[name='power']").val(best.tracer.power);
		$("input[name='degrees']").val(best.tracer.degrees);
		
		$('select.weapon option:nth-child(3)').attr('selected', 'selected');
		
		$("#fire").click();
		
	}
	
	getShipsAndDistances(position)
	{
		let results = [];
		
		this.game.world.ships.forEach(ship => {
			
			if(ship === this.player.ship)
				return;
			
			let dx	= ship.position.x - position.x;
			let dy	= ship.position.y - position.y;
			let d	= Math.sqrt(dx * dx + dy * dy);
			
			results.push({
				distance:	d,
				ship:		ship
			});
			
		});
		
		results.sort(function(a, b) {
			return (a.distance < b.distance ? -1 : 1);
		});
		
		return results;
	}
}