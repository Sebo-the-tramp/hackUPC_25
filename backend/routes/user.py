"""User related routes for the application."""

from flask import Blueprint, request, jsonify
from backend.db import db_session
from backend.models import User, Profile, Trip
from sqlalchemy.exc import SQLAlchemyError

# Create Blueprint
user_bp = Blueprint("user", __name__, url_prefix="/api")


@user_bp.route("/my-trips", methods=["GET"])
def my_trips():
    """Get all trips associated with the current user."""
    try:
        user_id = int(request.cookies.get("user_id"))
        user = db_session.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Only get trips where the user's profile is not deleted
        user_trips = (
            db_session.query(Trip)
            .join(Profile)
            .filter(Profile.user_id == user_id, Profile.deleted == False)
            .all()
        )
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid or missing user_id cookie"}), 401

    # Convert SQLAlchemy objects to dictionaries for JSON serialization
    trips = [{"id": trip.id, "name": trip.name} for trip in user_trips]

    return jsonify({"trips": trips})


@user_bp.route("/leave-trip", methods=["POST"])
def leave_trip():
    """Mark a user's profile as deleted in a trip (soft delete)."""
    try:
        user_id = int(request.cookies.get("user_id"))
        trip_id = request.json.get("trip_id")
        
        if not trip_id:
            return jsonify({"error": "Missing trip_id in request"}), 400
            
        # Find the user's profile for this trip
        profile = db_session.query(Profile).filter(
            Profile.user_id == user_id,
            Profile.trip_id == trip_id,
            Profile.deleted == False
        ).first()
        
        if not profile:
            return jsonify({"error": "User is not part of this trip or has already left"}), 404
        
        # Mark the profile as deleted instead of removing it
        profile.deleted = True
        db_session.commit()
        
        return jsonify({"success": True, "message": "Successfully left the trip"})
        
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid or missing user_id cookie"}), 401
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

