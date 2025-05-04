import pprint
import urllib.parse
import json5
from qwen_agent.agents import Assistant
from qwen_agent.tools.base import BaseTool, register_tool
from qwen_agent.utils.output_beautify import typewriter_print
from datetime import datetime
import gradio as gr

from skyscanner_api import create_flight_search, get_flight_from_airport, find_top_k_full_paths

# Add chat history storage
chat_history = []

# defining the 4 people
users = [
  {
    "name": "Karolina",
    "location": "US",
    "passport": ["US", "Poland"],
    "budget": 2000.0,
    "availability": "July 2 - August 18",
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

@register_tool
class IndicativeFlightPrice(BaseTool):
    description = 'The indicative price of a flight on a given monthly range.'
    parameters = [{
        'name': 'start_month',
        'type': 'string',
        'description': 'The start month of the flight in YYYY-MM format.'
    }, {
        'name': 'end_month',
        'type': 'string',
        'description': 'The end month of the flight in YYYY-MM format.'
    },{
        'name': 'airport_iata',
        'type': 'string',
        'description': 'The IATA code of the airport.'
    }
    ]
    
    def call(self, params: str, **kwargs) -> str:
        start_month = params['start_month']
        end_month = params['end_month']
        airport_iata = params['airport_iata']

        return get_indicative_price(start_month, end_month, airport_iata)

# Step 2: Configure the LLM you are using.
llm_cfg = {
    # Use the model service provided by DashScope:
    'model': 'qwen3:32b',
    'model_server': 'http://10.127.30.123:11434/v1',
    'generate_cfg': {
        'temperature': 0,
        'top_k': 1
    }
}

system_instruction = '''
You are a travel planner assistant helping the user and their friends organize trips based on the user information provided in the system message.
When the user requests travel advice or suggestions.
- Your only goal is to find the cheapest flight for the users, based on the information provided in the system message.

Current year is 2025.

User details:
''' + json5.dumps(users, ensure_ascii=False, indent=0)

tools = ['create_trip', 'find_shared_flight']  # `code_interpreter` is a built-in tool for executing code.
files = [] # ['./examples/resource/doc.pdf']  # Give the bot a PDF file to read.
bot = Assistant(llm=llm_cfg,
                system_message=system_instruction,
                function_list=tools,
                files=files)

from qwen_agent.gui import WebUI

# Modify the WebUI initialization to include chat history tracking and download button

# Replace the WebUI initialization with CustomWebUI
WebUI(bot).run()    