import Weapon from "./Weapon";
import Projectile from "../../entities/weapons/Projectile";

export default class Bomb extends Weapon
{
	constructor(world)
	{
		super(world);
	}
	
	fire(options)
	{
		let projectile		= new Projectile(this.world, options);
		
		projectile.once("collision", event => {
			
			let explosion	= projectile.explode({
				radius: this.radius,
				damage: this.damage
			});
			
			explosion.once("removed", event => {
				this.trigger("complete");
			});
			
		});
		
		projectile.launch(options);
		
		this.world.add(projectile);
	}
}