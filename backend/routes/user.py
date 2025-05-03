"""User related routes for the application."""

from flask import Blueprint, request, jsonify
from backend.db import db_session
from backend.models import User, Profile, Trip
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
from backend.routes.models import LeaveTripRequest

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

    except (TypeError, ValueError):
        return jsonify({"error": "Invalid or missing user_id cookie"}), 401

    return jsonify(
        {
            "trips": [
                {"id": trip.id, "name": trip.name, "users": trip.users}
                for trip in user.trips
            ]
        }
    )


@user_bp.route("/leave-trip", methods=["POST"])
def leave_trip():
    """Mark a user's profile as deleted in a trip (soft delete)."""
    try:
        # Validate request data using Pydantic
        try:
            req_data = LeaveTripRequest(**request.json)
        except ValidationError as e:
            return jsonify({"error": str(e)}), 400

        user_id = int(request.cookies.get("user_id"))
        if not user_id:
            return jsonify({"error": "No user_id cookie found"}), 401

        # Find the user's profile for this trip
        profile = (
            db_session.query(Profile)
            .filter(
                Profile.user_id == user_id,
                Profile.trip_id == req_data.trip_id,
                Profile.deleted == False,
            )
            .first()
        )

        if not profile:
            return jsonify(
                {"error": "User is not part of this trip or has already left"}
            ), 404

        # Mark the profile as deleted instead of removing it
        profile.deleted = True
        db_session.commit()

        return jsonify({"success": True, "message": "Successfully left the trip"})

    except (TypeError, ValueError):
        return jsonify({"error": "Invalid user_id cookie"}), 401
    except SQLAlchemyError as e:
        db_session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
