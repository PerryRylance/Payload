import Weapon from "./Weapon";
import Projectile from "../../entities/weapons/Projectile";
import Shock from "../../entities/Shock";

export default class Disruptor extends Weapon
{
	constructor(world)
	{
		super(world);
	}
	
	fire(options)
	{
		let projectile = new Projectile(this.world, options);
		
		projectile.once("collision", event => {
			
			let shock = new Shock(this.world, {
				radius:		this.radius,
				damage:		this.damage,
				position:	projectile.position
			});
			
			this.world.add(shock);
			
			projectile.remove();
			
		});
		
		projectile.launch(options);
		
		this.world.add(projectile);
	}
}