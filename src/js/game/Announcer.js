export default class Announcer
{
	constructor(game)
	{
		this.game		= game;
		this.element	= $("#announcement");
		
		game.on("turnstart", event => this.onTurnStart(event));
	}
	
	announce(html)
	{
		this.element
			.html(html)
			.show()
			.delay(2000)
			.fadeOut();
	}
	
	onTurnStart(event)
	{
		this.announce(event.player.name + "'s turn");
	}
}