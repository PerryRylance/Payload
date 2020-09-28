export default class Taunt
{
	constructor()
	{
		
	}
	
	generate(callback)
	{
		let result = "...";
		
		$.ajax("https://api.genr8rs.com/Content/Fun/GameTauntGenerator?genr8rsUserId=1599635090.15785f587e9226845&_sInsultLevel=polite", {
			
			success: function(response, status, xhr)
			{
				let json = JSON.parse(response);
				result = json._sResult;
			},
			
			complete: function()
			{
				callback(result);
			}
			
		});
	}
}