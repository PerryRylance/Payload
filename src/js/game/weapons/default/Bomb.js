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
		var projectile = new Projectile(this.world, options);
		
		projectile.on("collision", (event) => {
			projectile.explode();
		});
		
		projectile.launch(options);
		
		this.world.add(projectile);
	}
}