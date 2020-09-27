import SmallBomb from "./instantiatable/SmallBomb";
import MediumBomb from "./instantiatable/MediumBomb";
import LargeBomb from "./instantiatable/LargeBomb";
import MegaBomb from "./instantiatable/MegaBomb";

import SmallDisruptor from "./instantiatable/SmallDisruptor";
import MediumDisruptor from "./instantiatable/MediumDisruptor";
import LargeDisruptor from "./instantiatable/LargeDisruptor";
import MegaDisruptor from "./instantiatable/MegaDisruptor";

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
		},
		{
			"name":		"Small Disruptor",
			"cost":		5,
			"class":	SmallDisruptor
		},
		{
			"name":		"Medium Disruptor",
			"cost":		10,
			"class":	MediumDisruptor
		},
		{
			"name":		"Large Disruptor",
			"cost":		30,
			"class":	LargeDisruptor
		},
		{
			"name":		"Mega Disruptor",
			"cost":		60,
			"class":	MegaDisruptor
		},
	]
	
};