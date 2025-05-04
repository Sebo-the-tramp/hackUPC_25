"""User related routes for the application."""

from typing import Any, cast
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload
from backend.db import db_session
from backend.models import Message, User, Profile, Trip
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel, ValidationError
from backend.routes.util import get_user_id_from_cookie

# Create Blueprint
user_bp = Blueprint("user", __name__, url_prefix="/api")

@user_bp.route("/me", methods=["GET"])
def me():
    user_id = get_user_id_from_cookie(request)
    if not user_id:
        return jsonify({"error": "Not authenticated. No user_id cookie found"}), 401

    user = db_session.query(User).options(
        joinedload(User.trips).joinedload(Trip.users)
    ).filter(
        User.id == user_id
    ).first()

    if not user:
        return jsonify({"error": "User not found"}), 401

    return user.to_dict(only=("id", "name", "trips", "trips.name", "trips.id", "trips.users.id", "trips.users.name"))

@user_bp.route("/trip-info", methods=["GET"])
def trip_info():
    """
    Get information about a trip.
    If the user is not a member of the trip, only the trip name and users will be returned.
    If the user is a member, all trip information including messages will be returned.
    Returns JSON with trip information.
    """
    class TripInfoRequest(BaseModel):
        trip_id: int
        
    try:
        validated_data = TripInfoRequest(**cast(Any, request.args))
    except ValidationError as e:
        return jsonify({"error": f"Validation error: {str(e)}"}), 400

    # Build a single query with all necessary joinedloads
    trip = db_session.query(Trip).options(
        joinedload(Trip.users),
        joinedload(Trip.messages).joinedload(Message.user)
    ).filter(Trip.id == validated_data.trip_id).first()
    
    if not trip:
        return jsonify({"error": "Trip not found"}), 404

    user_id = get_user_id_from_cookie(request)
    if user_id and user_id in [user.id for user in trip.users]:
        return {
            "trip": trip.to_dict(only=("id", "name", "users.id", "users.name", "messages.id", "messages.content", "messages.user.id", "messages.user.name")),
            "is_member": True,
        } 
    else:
        return {
            "trip": trip.to_dict(only=("id", "name", "users.id", "users.name")),
            "is_member": False
        }

    

@user_bp.route("/leave-trip", methods=["POST"])
def leave_trip():
    class LeaveTripRequest(BaseModel):
        trip_id: int
    """Mark a user's profile as deleted in a trip (soft delete).
    Returns 200 OK if successful, or an error message if the trip or profile
    could not be found, or if the user is not authenticated.
    """
    user_id = get_user_id_from_cookie(request)
    if not user_id:
        return jsonify({"error": "Not authenticated. No user_id cookie found"}), 401
        
    try:
        validated_data = LeaveTripRequest(**request.get_json())
    except ValidationError as e:
        return jsonify({"error": f"Validation error: {str(e)}"}), 400
        
    # Find the user's profile for this trip
    profile = db_session.query(Profile).filter(
        Profile.user_id == user_id,
        Profile.trip_id == validated_data.trip_id,
        Profile.deleted == False
    ).first()
    
    if not profile:
        return jsonify({"error": "Profile not found for this trip or already deleted"}), 404
    
    # Soft delete the profile
    profile.deleted = True
    db_session.commit()
    
    return jsonify({"message": "Successfully left the trip"}), 200
        
