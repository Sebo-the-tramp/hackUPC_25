from flask import Flask, request, jsonify
from flask_cors import CORS
from optimizer import find_optimal_meetup 
from filter_itineraries import filter_itineraries

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

@app.route('/api/optimal-meetup', methods=['POST'])
def optimal_meetup():
    data = request.get_json()
    travelers = data.get('travelers', [])
    candidate_cities = data.get('candidate_cities', [])
    flight_costs = data.get('flight_costs', {})
    num_nights = data.get('num_nights', 1)
    weights = data.get('weights', None)

    result = find_optimal_meetup(  # <-- this matches your actual function name
        travelers,
        candidate_cities,
        flight_costs,
        num_nights,
        weights
    )
    return jsonify(result)

@app.route('/api/filter-itineraries', methods=['POST'])
def filter_itineraries_route():
    data = request.get_json()
    itineraries = data.get("itineraries", {})
    max_price = data.get("max_price")
    eco_only = data.get("eco_only", False)
    allowed_airlines = data.get("allowed_airlines", [])

    filtered = filter_itineraries(
        itineraries,
        max_price=max_price,
        eco_only=eco_only,
        allowed_airlines=allowed_airlines
    )
    return jsonify({"filtered_results": filtered})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
