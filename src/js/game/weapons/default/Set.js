import SmallBomb from "./instantiatable/SmallBomb";
import MediumBomb from "./instantiatable/MediumBomb";
import LargeBomb from "./instantiatable/LargeBomb";
import MegaBomb from "./instantiatable/MegaBomb";

export default {
	
	"name": "Default",
	
	"definitions": [
		{
			"name":		"Small Bomb",
			"cost":		0,
			"class":	SmallBomb
		},
		{
			"name":		"Medium Bomb",
			"cost":		10,
			"class":	MediumBomb
		},
		{
			"name":		"Large Bomb",
			"cost":		30,
			"class":	LargeBomb
		},
		{
			"name":		"Mega Bomb",
			"cost":		60,
			"class":	MegaBomb
		}
	]
	
};