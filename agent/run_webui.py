from agent.agent import make_bot
from qwen_agent.gui import WebUI


users = [
  {
    "name": "Karolina",
    "location": "US",
    "passport": ["US", "Poland"],
    "budget": 2000.0,
    "availability": "July 2 - August 28",
    "visited": ["Germany", "Canada"],
    "preferences": {
      "climate": "mild",
      "activities": ["beach", "city tours"]
    },
    "age": 31,
    "language_spoken": ["English", "Polish"],
    "dietary_restrictions": "Vegetarian",
    "nearest_airport": ["JFK"]
  },
  {
    "name": "Mikka",
    "location": "Finland",
    "passport": ["Finland"],
    "budget": 1500.0,
    "availability": "June 15 - August 15",
    "visited": ["Sweden", "Norway"],
    "preferences": {
      "climate": "cool",
      "activities": ["nature", "cycling", "surfing"]
    },
    "age": 26,
    "language_spoken": ["Finnish", "English", "Swedish"],
    "dietary_restrictions": "Lactose intolerant",
    "nearest_airport": ["HEL"]
  },
  {
    "name": "Sebastian",
    "location": "Trento, Italy",
    "nearest_airport": ["BGY"],
    "passport": ["Italy"],
    "budget": 1800.0,
    "availability": "1st of July - 31st of August",
    "visited": ["Spain", "Ireland", "UAE", "Malta", "Bulgaria"],
    "preferences": {
      "activities": ["surfing", "bars"]
    },
    "age": 25,
    "language_spoken": ["Italian", "English", "German"],
    "dietary_restrictions": "Vegetarian"
  }
]
    
WebUI(make_bot(users)).run()
