import Entity from "./Entity";

export default class Sound extends Entity
{
	constructor(world, options)
	{
		super(world);
		
		if(!options.asset)
		{
			console.warn("No asset specified for Sound");
			return;
		}
		
		this.asset = options.asset;
		
		this.once("added", event => this.onAdded(event));
	}
	
	onAdded(event)
	{
		this.audio = new THREE.Audio(this.world.listener);
		this.audio.setBuffer(this.asset.resource);
		this.audio.play();
		
		this.audio.onEnded = () => {
			this.remove();
		};
	}
}