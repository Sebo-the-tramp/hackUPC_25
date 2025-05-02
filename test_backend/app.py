from flask import Flask, request, jsonify
from flask_cors import CORS
from optimizer import find_optimal_meetup

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests for Next.js frontend

@app.route('/api/optimal-meetup', methods=['POST'])
def optimal_meetup():
    data = request.get_json()
    travelers = data.get('travelers', [])
    candidate_cities = data.get('candidate_cities', [])
    flight_costs = data.get('flight_costs', {})
    num_nights = data.get('num_nights', 1)

    result = find_optimal_meetup(travelers, candidate_cities, flight_costs, num_nights)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
