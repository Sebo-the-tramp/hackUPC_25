"""Main Flask application."""
from flask import Flask
from flask_cors import CORS

from backend.db import init_db, shutdown_session
from backend.routes.trip_routes import trip_bp

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app, supports_credentials=True)
    
    # Register blueprints
    app.register_blueprint(trip_bp)
    
    # Initialize database
    with app.app_context():
        init_db()
    
    # Register shutdown function
    app.teardown_appcontext(shutdown_session)
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Simple health check endpoint."""
        return {'status': 'OK'}
    
    return app

# Application instance for WSGI servers
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)