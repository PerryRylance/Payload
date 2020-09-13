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
		
		projectile.once("collision", (event) => {
			projectile.explode();
		});
		
		projectile.launch(options);
		
		this.world.add(projectile);
	}
}