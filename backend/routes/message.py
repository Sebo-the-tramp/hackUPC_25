"""Message related routes for the application."""

from pydantic import BaseModel, ValidationError

from flask import Blueprint, request, jsonify
from backend.db import db_session
from backend.models import User, Profile, Trip, Message

# Create Blueprint
message_bp = Blueprint("message", __name__, url_prefix="/api")


@message_bp.route("/send-message", methods=["POST"])
def send_message():
    # Pydantic model for this specific endpoint
    class SendMessageRequest(BaseModel):
        """Model for send message request."""
        trip_id: int
        content: str
        
    """
    Send a message to a trip.

    Expects a JSON payload with:
    {
        "trip_id": 1,
        "content": "Message content"
    }

    Requires a user_id cookie to be set.
    """
    try:
        # Get user ID from cookie
        user_id = request.cookies.get("user_id")

        if not user_id:
            return jsonify(
                {"error": "No user_id cookie found. Please create a trip first."}
            ), 401

        try:
            user_id = int(user_id)
        except ValueError:
            return jsonify({"error": "Invalid user ID format in cookie"}), 400

        # Validate request data with Pydantic
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        validated_data = SendMessageRequest(**data)

        # Verify the trip exists
        trip = db_session.query(Trip).filter(Trip.id == validated_data.trip_id).first()
        if not trip:
            return jsonify({"error": "Trip not found"}), 404

        # Verify the user exists and has a profile for this trip
        profile = (
            db_session.query(Profile)
            .filter(Profile.user_id == user_id, Profile.trip_id == validated_data.trip_id)
            .first()
        )

        if not profile:
            # Check if user exists but doesn't have a profile for this trip
            user_exists = db_session.query(User).filter(User.id == user_id).first()
            if user_exists:
                return jsonify({"error": "You are not a member of this trip"}), 403
            else:
                return jsonify({"error": "User not found"}), 404

        # Create and save the message
        new_message = Message(
            content=validated_data.content, 
            is_ai=False, 
            trip_id=validated_data.trip_id, 
            profile_id=profile.id
        )

        db_session.add(new_message)
        db_session.commit()

        return jsonify(
            {"message_id": new_message.id, "status": "Message sent successfully"}
        )
    
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400