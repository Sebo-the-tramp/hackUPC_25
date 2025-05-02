def find_optimal_meetup(travelers, candidate_cities, flight_costs, num_nights=1):
    min_total_cost = float('inf')
    best_city = None
    cost_breakdown = {}

    for city_info in candidate_cities:
        city_name = city_info['city']
        hotel_cost_per_night = city_info['hotel_cost']
        total_hotel_cost = hotel_cost_per_night * num_nights
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

        total_cost = total_flight_cost + total_hotel_cost

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
