import Weapon from "../Weapon";
import Projectile from "../../../entities/weapons/Projectile";

export default class Bomb extends Weapon
{
	constructor(world)
	{
		super(world);
	}
	
	get radius()
	{
		return 100;
	}
	
	get damage()
	{
		return 15;
	}
	
	fire(options)
	{
		let projectiles = [];
		let remaining	= 3;
		
		for(var i = 0; i < 3; i++)
		{
			let projectile = new Projectile(this.world, options);
			
			projectile.once("collision", event => {
				
				let explosion	= projectile.explode({
					radius: this.radius,
					damage: this.damage
				});
				
				if(--remaining == 0)
					this.trigger("complete");
				
			})
			
			projectiles.push(projectile);
		}
		
		for(var i = 0; i < 3; i++)
		{
			let offset	= (i - 1) * 15;
			
			projectiles[i].launch($.extend({}, options, {
				degrees: options.degrees + offset
			}));
			
			this.world.add(projectiles[i]);
		}
	}
}