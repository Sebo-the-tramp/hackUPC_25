"""Routes package initialization.

This module imports and registers all route blueprints from the routes package.
"""

from backend.routes.trip import trip_bp
from backend.routes.message import message_bp
from backend.routes.user import user_bp

# List of all blueprints to be registered with the app
blueprints = [trip_bp, message_bp, user_bp]