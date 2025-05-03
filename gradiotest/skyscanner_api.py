import json
import requests
from collections import defaultdict
from datetime import datetime, timedelta

headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sh967490139224896692439644109194"  # Replace with your actual API key
}


def get_price_indicative(departure_iata, arrival_iata, start_date, end_date=None):
    url = "https://partners.api.skyscanner.net/apiservices/v3/flights/indicative/search"

    # Parse dates and handle month transitions
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    if end_date is not None:
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

    payload = {
        "query": {
            "currency": "EUR",
            "locale": "en-GB",
            "market": "UK",
            "queryLegs": [
                {
                    "originPlace": {
                        "queryPlace": {
                            "iata": departure_iata
                        }
                    },
                    "destinationPlace": {
                        "queryPlace": {
                            "iata": arrival_iata
                        }
                    },
                    "fixedDate": {
                        "year": 2025,
                        "month": start_date_obj.month,
                        "day": start_date_obj.day
                    }
                },
            ]
        }
    }

    if end_date is not None:
        payload['query']['queryLegs'].append({
                    "originPlace": {
                        "queryPlace": {
                            "iata": arrival_iata
                        }
                    },
                    "destinationPlace": {
                        "queryPlace": {
                            "iata": departure_iata
                        }
                    },
                    "fixedDate": {
                        "year": 2025,
                        "month": end_date_obj.month,
                        "day": end_date_obj.day
                    }
                }
            )

    response = requests.post(url, json=payload, headers=headers)
    res_dict = response.json()

    # # save the res_dict to a file
    # with open('res_dict_'+departure_iata+'_'+arrival_iata+'_'+start_date+'_'+end_date+'.json', 'w') as f:
    #     json.dump(res_dict, f)

    return res_dict
    
def create_flight_search(departure_iata, arrival_iata, start_date, end_date=None, adults=1):

    # add a combination of green things as well

    url = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create"
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")

    query_legs = [{
        "originPlaceId": {
            "iata": departure_iata
        },
        "destinationPlaceId": {
            "iata": arrival_iata
        },
        "date": {
            "year": start_date_obj.year,
            "month": start_date_obj.month,
            "day": start_date_obj.day
        }
    }]

    if end_date:
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
        query_legs.append({
            "originPlaceId": {
               "iata": arrival_iata 
            },
            "destinationPlaceId": {
                "iata": departure_iata
            },
            "date": {
                "year": end_date_obj.year,
                "month": end_date_obj.month,
                "day": end_date_obj.day
            }
        })

    payload = {
        "query": {
            "market": "UK",
            "locale": "en-GB",
            "currency": "EUR",
            "queryLegs": query_legs,
            "adults": adults,
            "cabinClass": "CABIN_CLASS_ECONOMY",
            "includeSustainabilityData": True,
            "nearbyAirports": False
        }
    }

    # print(payload)

    response = requests.post(url, json=payload, headers=headers)
    res_dict = response.json()

    itineraries = res_dict['content']['results']['itineraries']

    filtered_itineraries = []

    airlines = res_dict['content']['results']['carriers']
    segments = res_dict['content']['results']['segments']
    places = res_dict['content']['results']['places']
    carriers = res_dict['content']['results']['carriers']

    for iter in itineraries:
        single_itinerary = {}
        single_itinerary['price'] = itineraries[iter]['pricingOptions'][0]['price']['amount']
        single_itinerary['unit'] = itineraries[iter]['pricingOptions'][0]['price']['unit']
        # single_itinerary['agentIds'] = itineraries[iter]['pricingOptions'][0]['agentIds']
        single_itinerary['ecoContenderDelta'] = itineraries[iter]['sustainabilityData']['ecoContenderDelta']
        single_itinerary['isEcoContender'] = itineraries[iter]['sustainabilityData']['isEcoContender']
        single_itinerary['segments'] = [] 

        for segment in itineraries[iter]['pricingOptions'][0]['items'][0]['fares']:
            single_segment = {
                # 'segmentId': segments[segment['segmentId']],
                'from': places[segments[segment['segmentId']]['originPlaceId']]['name'],
                'departure': segments[segment['segmentId']]['departureDateTime'],
                'arrival': segments[segment['segmentId']]['arrivalDateTime'],
                'duration': segments[segment['segmentId']]['durationInMinutes'],
                'to': places[segments[segment['segmentId']]['destinationPlaceId']]['name'],
                'name': carriers[segments[segment['segmentId']]['operatingCarrierId']]['name'],
            }
            single_itinerary['segments'].append(single_segment)
        
        filtered_itineraries.append(single_itinerary)

    filtered_itineraries.sort(key=lambda x: float(x['price']))

    return filtered_itineraries[:2]


def get_flight_from_airport(airport_iata, start_date, end_date=None, adults=1):
    url = "https://partners.api.skyscanner.net/apiservices/v3/flights/indicative/search"

    # Parse dates and handle month transitions
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    if end_date is not None:
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")

    payload = {
        "query": {
            "currency": "EUR",
            "locale": "en-GB",
            "market": "UK",
            "queryLegs": [
                {
                    "originPlace": {
                        "queryPlace": {
                            "iata": airport_iata
                        }
                    },
                    "destinationPlace": {
                        "anywhere": True
                    },
                   "dateRange": {
                        "startDate": {
                        "year": start_date_obj.year,
                        "month": start_date_obj.month,
                        },
                        "endDate": {
                        "year": start_date_obj.year,
                        "month": start_date_obj.month,
                        }
                    }
                },
            ]
        }
    }

    if end_date is not None:
        payload['query']['queryLegs'].append({
                    "originPlace": {
                        "anywhere": True
                    },
                    "destinationPlace": {
                        "queryPlace": {
                            "iata": airport_iata
                        }
                    },
                    "dateRange": {
                        "startDate": {
                            "year": end_date_obj.year,
                            "month": end_date_obj.month,
                        },
                        "endDate": {
                            "year": end_date_obj.year,
                            "month": end_date_obj.month,
                        }
                }
                }
            )

    response = requests.post(url, json=payload, headers=headers)
    res_dict = response.json()

    print(res_dict)

    # with open('res_dict_from.json', 'w') as f:
    #     json.dump(res_dict, f)

    quotes = res_dict['content']['results']['quotes']
    places = res_dict['content']['results']['places']

    responses_filtered = []
    for iter in quotes:
        single_itinerary = {}
        min_price = quotes[iter]['minPrice']['amount']
        origin_place_id = quotes[iter]['outboundLeg']['originPlaceId']
        destination_place_id = quotes[iter]['outboundLeg']['destinationPlaceId']

        single_itinerary['origin_place_id'] = origin_place_id
        single_itinerary['destination_place_id'] = destination_place_id
        single_itinerary['price'] = min_price
        single_itinerary['inbound_place_id'] = places[origin_place_id]['name']
        single_itinerary['outbound_place_id'] = places[destination_place_id]['name']
        single_itinerary['departure_date'] = quotes[iter]['outboundLeg']['departureDateTime']
        single_itinerary['return_date'] = quotes[iter]['inboundLeg']['departureDateTime']

        print(single_itinerary)
        responses_filtered.append(single_itinerary)

    responses_filtered.sort(key=lambda x: float(x['price']))

    return responses_filtered, places


def extract_id_cost(all_raw_lists):
    all_cleaned = []
    for lst in all_raw_lists:
        cleaned = []
        for item in lst:
            id_ = item['destination_place_id']
            cost = int(item['price'])  # ensure numeric
            cleaned.append((id_, cost))
        all_cleaned.append(cleaned)
    return all_cleaned
    
def find_top_k_full_paths(all_lists, k, match_key='destination_place_id', cost_key='price'):
    n = len(all_lists)
    id_matches = defaultdict(list)

    for lst in all_lists:
        seen = set()
        for item in lst:
            id_ = item[match_key]
            if id_ not in seen:
                id_matches[id_].append(item)
                seen.add(id_)

    # Only ids present in all lists
    valid = {k: v for k, v in id_matches.items() if len(v) == n}

    results = []
    for id_, trips in valid.items():
        total_cost = sum(int(t[cost_key]) for t in trips)
        results.append((id_, trips, total_cost))

    results.sort(key=lambda x: x[2])
    return results[:k]

def user_share_flight(users):

    raw_user_list = []

    for user in users:
        res_user, places_user = get_flight_from_airport(user["departure_iata"], user["start_date"], user["end_date"], 1)
        raw_user_list.append(res_user)
    
    best_ids = find_top_k_full_paths(raw_user_list, 20)

    for _, tuples, total_cost in best_ids:
        print("TOTAL COST: ", total_cost)
        for t in tuples:
            print("FROM: ", places_user[t["origin_place_id"]]["name"])
            print("TO: ", places_user[t["destination_place_id"]]["name"])
            print("PRICE: ", t["price"])
        print("\n\n")


def test_query():
    users = [
        {"departure_iata": "VIE", "start_date": "2025-05-06", "end_date": "2025-05-16"},
        {"departure_iata": "JFK", "start_date": "2025-05-04", "end_date": "2025-05-19"},
        {"departure_iata": "HEL", "start_date": "2025-05-07", "end_date": "2025-05-13"}
    ]
    user_share_flight(users)

if __name__ == "__main__":
    test_query()