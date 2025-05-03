import requests
import time
import json

# ===== CONFIG =====
API_KEY = ""
FLASK_URL = "http://localhost:5000/api/filter-itineraries"

# ===== STEP 1: CREATE SEARCH SESSION =====
create_url = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create"
headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

search_payload = {
  "query": {
    "market": "UK",
    "locale": "en-GB",
    "currency": "GBP",
    "cabinClass": "CABIN_CLASS_ECONOMY",
    "adults": 1,
    "childrenAges": [],
    "includeSustainabilityData": True,
    "queryLegs": [
      {
        "originPlaceId": { 
            "entityId": "27544008" 
        },
        "destinationPlaceId":{
            "entityId": "27539726" 
        },
        "date": {
          "year": 2025,
          "month": 6,
          "day": 15
        }
      }
    ]
}

}

print("Creating Skyscanner search session...")
response = requests.post(create_url, json=search_payload, headers=headers)
response.raise_for_status()
session_token = response.json()["sessionToken"]
print(f"Session token: {session_token}")

# ===== STEP 2: POLL FOR RESULTS =====
poll_url = f"https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/poll/{session_token}"
poll_headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

print("Polling for results...")
for attempt in range(10):  # max 10 polls
    poll_response = requests.post(poll_url, json={}, headers=poll_headers)
    poll_response.raise_for_status()
    poll_data = poll_response.json()

    status = poll_data.get("status")
    if status == "RESULT_STATUS_COMPLETE":
        print("Poll complete!")
        break
    else:
        print(f"Poll attempt {attempt + 1}: status {status}, waiting...")
        time.sleep(2)  # wait before next poll
else:
    raise Exception("Polling failed to complete after 10 attempts")

itineraries = poll_data["content"]["results"]["itineraries"]
print(f"Number of itineraries received: {len(itineraries)}")

if itineraries:
    first_key = list(itineraries.keys())[0]
    first_itinerary = itineraries[first_key]
    print(f"\n--- Dumping itinerary: {first_key} ---")
    print(json.dumps(first_itinerary, indent=2))
else:
    print("No itineraries to dump.")
# ===== STEP 3: SEND TO FLASK FILTER ROUTE =====
filter_payload = {
    "itineraries": itineraries,
    "eco_only": True,
    "allowed_airlines": ['flsh']  # example agent IDs
}

print("Sending itineraries to Flask filter endpoint...")
flask_response = requests.post(FLASK_URL, json=filter_payload)
flask_response.raise_for_status()
filtered_results = flask_response.json()

# ===== STEP 4: DISPLAY FILTERED OUTPUT =====
print("\nFiltered Results:")
for item in filtered_results["filtered_results"]:
    print(f"- Itinerary: {item['itinerary_id']}")
    if item['price'] is not None:
        print(f"  Price: ${item['price']:.2f}")
    else:
        print("  Price: N/A")
    print(f"  Agents: {item['agent_ids']}")
    print(f"  Eco-friendly: {item['eco_contender']} (Delta: {item['eco_delta']})")
    print(f"  Booking link: {item['deep_link']}")
    print("")


print("✅ Done!")
