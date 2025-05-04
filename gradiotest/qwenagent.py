import os
import json5
from mcp_functions import *

# Add chat history storage
chat_history = []

# defining the 4 people
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
    
# Step 2: Configure the LLM you are using.




from qwen_agent.gui import WebUI

# Modify the WebUI initialization to include chat history tracking and download button

# Replace the WebUI initialization with CustomWebUI
WebUI(make_bot(users)).run()
