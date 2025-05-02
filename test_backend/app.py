from flask import Flask, request, jsonify
from flask_cors import CORS
from optimizer import find_optimal_meetup, find_optimal_meetup_advanced

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

@app.route('/api/optimal-meetup-advanced', methods=['POST'])
def optimal_meetup_advanced():
    data = request.get_json()
    travelers = data.get('travelers', [])
    candidate_cities = data.get('candidate_cities', [])
    flight_costs = data.get('flight_costs', {})
    num_nights = data.get('num_nights', 1)
    weights = data.get('weights', None)

    result = find_optimal_meetup_advanced(
        travelers,
        candidate_cities,
        flight_costs,
        num_nights,
        weights
    )
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
