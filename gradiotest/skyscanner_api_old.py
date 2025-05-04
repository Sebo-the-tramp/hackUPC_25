import json
import requests
from collections import defaultdict
from datetime import datetime, timedelta

headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer "  # Replace with your actual API key
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
        responses_filtered.append(single_itinerary)

    responses_filtered.sort(key=lambda x: float(x['price']))

    return responses_filtered, places

def filter_by_user_availability(all_lists, user_availabilities):
    filtered = []

    for user_flights, user_avail in zip(all_lists, user_availabilities):
        min_date = datetime(**user_avail['min_date'])
        max_date = datetime(**user_avail['max_date'])

        valid_flights = []
        for flight in user_flights:
            dep = datetime(**flight['departure_date'])
            ret = datetime(**flight['return_date'])

            if min_date <= dep and ret <= max_date:
                valid_flights.append(flight)

        filtered.append(valid_flights)

    return filtered

def find_top_k_full_paths(all_lists, k, match_key='destination_place_id', cost_key='price', min_days=7):
    from datetime import datetime
    n = len(all_lists)
    id_matches = defaultdict(list)

    def get_duration_days(trip):
        dep = datetime(**trip['departure_date'])
        ret = datetime(**trip['return_date'])
        return (ret - dep).days

    for lst in all_lists:
        seen = set()
        for item in lst:
            id_ = item[match_key]
            if id_ not in seen:
                id_matches[id_].append(item)
                seen.add(id_)

    valid = {k: v for k, v in id_matches.items()
             if len(v) == n and all(get_duration_days(t) >= min_days for t in v)}

    results = []
    for id_, trips in valid.items():
        total_cost = sum(int(t[cost_key]) for t in trips)
        total_days = sum(get_duration_days(t) for t in trips)
        results.append((id_, trips, total_cost, total_days))

    results.sort(key=lambda x: (x[2], -x[3]))  # minimize cost, maximize duration
    return results[:k]

def filter_by_user_availability(all_lists, users):
    filtered = []

    for user_flights, user in zip(all_lists, users):
        min_date = datetime.strptime(user["start_date"], "%Y-%m-%d")
        max_date = datetime.strptime(user["end_date"], "%Y-%m-%d")

        valid_flights = []
        for flight in user_flights:
            dep = datetime(**flight["departure_date"])
            ret = datetime(**flight["return_date"])

            if min_date <= dep and ret <= max_date:
                valid_flights.append(flight)

        filtered.append(valid_flights)

    return filtered

from collections import defaultdict
from itertools import product
from datetime import datetime

# helper ─ convert nested date-dict → datetime
def to_dt(d):
    return datetime(d['year'], d['month'], d['day'],
                    d.get('hour', 0), d.get('minute', 0), d.get('second', 0))

def triplet_overlap(lists,
                    dest_key='destination_place_id',
                    start_key='departure_date',
                    end_key='return_date',
                    min_days=5,
                    max_days=14):
    """
    One dict per list is kept when:
      1) all three share the same dest;
      2) [max(start), min(end)] is a valid interval.
    Returns [{'dest': d, 'interval': (start, end), 'triplet': combo}, …]
    """
    n = len(lists)
    buckets = defaultdict(lambda: [[] for _ in range(n)])

    # group by destination
    for idx, lst in enumerate(lists):
        for item in lst:
            buckets[item[dest_key]][idx].append(item)

    res = []
    for dest, per_list in buckets.items():
        if any(not b for b in per_list):
            continue
        for combo in product(*per_list):
            start = max(to_dt(i[start_key]) for i in combo)
            end   = min(to_dt(i[end_key])   for i in combo)
            if start < end and (end - start).days > min_days and (end - start).days < max_days:
                      # positive overlap
                res.append({'dest': dest,
                            'total_days': end - start,
                            'total_price': sum(int(i['price']) for i in combo),
                            'triplet': combo,
                            'interval': (start, end),
                    })
    return res

def format_trip_options(filtered_lists, max_options=5, users=None):
    result = []
    for match in filtered_lists[:max_options]:
        trip_info = []
        trip_info.append(f"Destination: {match['triplet'][0]['outbound_place_id']}")
        trip_info.append(f"Total trip duration: {match['total_days'].days} days")
        trip_info.append(f"Trip dates: {match['interval'][0].strftime('%B %d, %Y')} to {match['interval'][1].strftime('%B %d, %Y')}")
        
        for i, user in enumerate(match['triplet']):
            trip_info.append(f"User {users[i]['name']}")
            trip_info.append(f"  Departure: {user['departure_date']['month']}/{user['departure_date']['day']}/{user['departure_date']['year']}")
            trip_info.append(f"  Return: {user['return_date']['month']}/{user['return_date']['day']}/{user['return_date']['year']}")
            trip_info.append(f"  Cost: {user['price']} EUR")
            
        trip_info.append(f"Total cost for all users: {sum(int(user['price']) for user in match['triplet'])} EUR")
        result.append('\n'.join(trip_info))

        print(result)
    
    return '\n\n'.join(result)

def user_share_flight(raw_user_list, users):

    filtered_lists = triplet_overlap(raw_user_list)

    filtered_lists.sort(key=lambda x: x['total_price'])
    
    return format_trip_options(filtered_lists, 5, users)

def get_indicative_price(start_month, end_month, start_iata, end_iata):
    url = "https://partners.api.skyscanner.net/apiservices/v3/flights/indicative/search"

    payload = {
        "query": {
            "currency": "EUR",
            "locale": "en-GB",
            "market": "UK",
            "dateTimeGroupingType": "DATE_TIME_GROUPING_TYPE_BY_DATE",
            "queryLegs": [
                {
                    "originPlace": {
                        "queryPlace": {
                            "iata": start_iata
                        }
                    },
                    "destinationPlace": {
                        "queryPlace": {
                            "iata": end_iata
                        }
                    },
                    "dateRange": {
                        "startDate": {
                            "year": start_month.year,
                            "month": 6,
                        },
                        "endDate": {
                            "year": end_month.year,
                            "month": 6,
                        }
                    }
                }
            ]
        }
    }

    response = requests.post(url, json=payload, headers=headers)
    res_dict = response.json()

    quotes = res_dict['content']['results']['quotes']
    filtered_quotes = []
    for quote in quotes:
        print(quotes[quote])
        filtered_quote = {
            'name': quotes[quote]['name'],
            'price': quotes[quote]['price']['amount'],
            'from': quotes[quote]['outboundLeg']['originPlace']['name'],
            'to': quotes[quote]['outboundLeg']['destinationPlace']['name']
        }
        filtered_quotes.append(filtered_quote)

    print(filtered_quotes)

    return res_dict

def test_query():
    users = [
        {"departure_iata": "VIE", "start_date": "2025-06-01", "end_date": "2025-07-30"},
        {"departure_iata": "JFK", "start_date": "2025-06-01", "end_date": "2025-07-30"},
        {"departure_iata": "HEL", "start_date": "2025-06-01", "end_date": "2025-07-30"}
    ]
    user_share_flight(users)

    # start_month = datetime(2025, 6, 1)
    # end_month = datetime(2025, 6, 30)
    # start_iata = "VIE"
    # end_iata = "JFK"
    # res = get_indicative_price(start_month, end_month, start_iata, end_iata)
    # print(len(res))

if __name__ == "__main__":
    test_query()