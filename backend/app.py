"""Main Flask application."""
from flask import Flask, jsonify, request
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from flask_socketio import SocketIO
from pydantic import ValidationError

from backend.db import init_db, shutdown_session
from backend.routes import blueprints

# Initialize SocketIO instance at module level
socketio = SocketIO()

class MyJsonEncoder(DefaultJSONProvider):
    def default(self, obj):
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        return super().default(obj)

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.json = MyJsonEncoder(app)
    
    # Enable CORS
    CORS(app, supports_credentials=True)
    
    # Register all blueprints from the routes package
    for blueprint in blueprints:
        app.register_blueprint(blueprint)
    
    # Initialize database
    with app.app_context():
        init_db()
    
    # Register shutdown function
    app.teardown_appcontext(shutdown_session)
    
    # Register global error handlers
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        """Handle Pydantic validation errors globally."""
        return jsonify({
            "error": "Validation error",
            "details": error.errors()
        }), 400
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Simple health check endpoint."""
        return {'status': 'OK'}
    
    # Initialize SocketIO with the app
    socketio.init_app(app, cors_allowed_origins="*")
    
    # SocketIO event handlers
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')
    
    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')
    
    @socketio.on('join')
    def handle_join(data):
        """Join a trip room to receive WebSocket updates for that trip."""
        if 'trip_id' in data:
            trip_id = data['trip_id']
            room = f'trip_{trip_id}'
            from flask_socketio import join_room
            join_room(room)  # Join the room for this trip
            print(f"Client joined room: {room}")
            
    return app

# Application instance for WSGI servers
app = create_app()

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
