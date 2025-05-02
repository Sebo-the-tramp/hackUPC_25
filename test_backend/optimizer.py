def find_optimal_meetup(travelers, candidate_cities, flight_costs, num_nights=1):
    min_total_cost = float('inf')
    best_city = None
    cost_breakdown = {}

    for city_info in candidate_cities:
        city_name = city_info['city']
        hotel_cost = city_info['hotel_cost'] * num_nights
        total_flight_cost = 0
        missing_costs = False

        for traveler in travelers:
            traveler_name = traveler['name']
            city_flight_cost = flight_costs.get(traveler_name, {}).get(city_name)
            if city_flight_cost is None:
                missing_costs = True
                break
            total_flight_cost += city_flight_cost

        if missing_costs:
            continue

        total_cost = total_flight_cost + hotel_cost

        cost_breakdown[city_name] = {
            'total_flight_cost': total_flight_cost,
            'hotel_cost': total_hotel_cost,
            'total_cost': total_cost
        }

        if total_cost < min_total_cost:
            min_total_cost = total_cost
            best_city = city_name

    if best_city is None:
        return {
            'error': 'No valid city found (possibly missing cost data)'
        }

    return {
        'best_city': best_city,
        'min_total_cost': min_total_cost,
        'cost_breakdown': cost_breakdown
    }

# Advanced version
def normalize(value, min_value, max_value, inverse=False):
    if max_value == min_value:
        return 0
    norm = (value - min_value) / (max_value - min_value)
    return 1 - norm if inverse else norm

def find_optimal_meetup_advanced(
    travelers,
    candidate_cities,
    flight_costs,
    num_nights=1,
    weights=None
):
    if weights is None:
        weights = { "cost": 0.4, "green": 0.2, "interest": 0.2, "event": 0.2 }

    scores = {}
    all_total_costs = []
    all_co2s = []
    all_interest_scores = []
    all_event_scores = []

    for city in candidate_cities:
        city_name = city['city']
        hotel_cost = city['hotel_cost'] * num_nights
        co2_kg = city['co2_kg']
        interest_score = city['interest_score']
        event_score = city['event_score']

        total_flight_cost = sum(
            flight_costs.get(traveler['name'], {}).get(city_name, float('inf'))
            for traveler in travelers
        )
        total_cost = total_flight_cost + hotel_cost

        all_total_costs.append(total_cost)
        all_co2s.append(co2_kg)
        all_interest_scores.append(interest_score)
        all_event_scores.append(event_score)

        scores[city_name] = {
            'total_cost': total_cost,
            'co2_kg': co2_kg,
            'interest_score': interest_score,
            'event_score': event_score
        }

    min_cost, max_cost = min(all_total_costs), max(all_total_costs)
    min_co2, max_co2 = min(all_co2s), max(all_co2s)
    min_interest, max_interest = min(all_interest_scores), max(all_interest_scores)
    min_event, max_event = min(all_event_scores), max(all_event_scores)

    best_city = None
    best_score = -1

    for city_name, data in scores.items():
        norm_cost = normalize(data['total_cost'], min_cost, max_cost, inverse=True)
        norm_co2 = normalize(data['co2_kg'], min_co2, max_co2, inverse=True)
        norm_interest = normalize(data['interest_score'], min_interest, max_interest)
        norm_event = normalize(data['event_score'], min_event, max_event)

        overall_score = (
            weights['cost'] * norm_cost +
            weights['green'] * norm_co2 +
            weights['interest'] * norm_interest +
            weights['event'] * norm_event
        )

        scores[city_name]['normalized'] = {
            'cost': norm_cost,
            'co2': norm_co2,
            'interest': norm_interest,
            'event': norm_event,
            'overall_score': overall_score
        }

        if overall_score > best_score:
            best_score = overall_score
            best_city = city_name

    return {
        'best_city': best_city,
        'best_score': best_score,
        'scores': scores
    }
