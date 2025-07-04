"""Trip related routes for the application."""

from typing import List, Optional
from backend.routes import user
from pydantic import BaseModel, ValidationError

from flask import Blueprint, request, jsonify, make_response
from backend.db import db_session
from backend.models import User, Profile, Trip, Message
from sqlalchemy.orm import joinedload
from backend.routes.models import QuestionAnswer

# Create Blueprint
trip_bp = Blueprint("trip", __name__, url_prefix="/api")


@trip_bp.route("/create-trip", methods=["POST"])
def create_trip():
    # Pydantic model for this specific endpoint
    class CreateTripRequest(BaseModel):
        """Model for create trip request."""

        name: Optional[str] = None
        trip_name: str
        questions: List[QuestionAnswer]

    """
    Create a new trip and user profile with the provided data.

    Expects a JSON payload with:
    {
        "name": "User Name",  // Optional if user_id cookie is already set for an existing user
        "trip_name": "Trip Name",
        "questions": [{
            "question": "Question text",
            "answer": "Answer text"
        }, ...]
    }

    If the user_id cookie is already set, it will use the existing user.
    Otherwise, it will create a new user and set the cookie.
    """
    try:
        # Validate request data with Pydantic
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        validated_data = CreateTripRequest(**data)

        # Check if user already exists via cookie
        existing_user_id = request.cookies.get("user_id")

        # Create a new trip
        new_trip = Trip(name=validated_data.trip_name)
        db_session.add(new_trip)
        db_session.flush()  # Flush to get the trip ID

        # Handle user creation/retrieval
        if existing_user_id:
            try:
                # Use existing user if the cookie is set
                user_id = int(existing_user_id)
                user = db_session.query(User).filter(User.id == user_id).first()

                if not user:
                    # If user doesn't exist despite having cookie, create a new user
                    if validated_data.name is None:
                        return jsonify({"error": "Name is required for new users"}), 400

                    user = User(name=validated_data.name)
                    db_session.add(user)
                    db_session.flush()
                    set_cookie = True
                else:
                    set_cookie = False
            except ValueError:
                # If cookie value is invalid, create a new user
                if validated_data.name is None:
                    return jsonify({"error": "Name is required for new users"}), 400

                user = User(name=validated_data.name)
                db_session.add(user)
                db_session.flush()
                set_cookie = True
        else:
            # Create a new user if no cookie is set
            if validated_data.name is None:
                return jsonify({"error": "Name is required for new users"}), 400

            user = User(name=validated_data.name)
            db_session.add(user)
            db_session.flush()
            set_cookie = True

        # Convert Pydantic models to dictionaries for storage
        questions_data = [q.model_dump() for q in validated_data.questions]

        # Create a new profile for this trip
        profile = Profile(
            questions=questions_data, trip_id=new_trip.id, user_id=user.id
        )
        db_session.add(profile)
        db_session.commit()

        # Create response object
        response = make_response(
            jsonify(
                {"trip_id": new_trip.id, "user_id": user.id, "profile_id": profile.id}
            )
        )

        # Set user cookie only if it wasn't already set correctly
        if set_cookie:
            response.set_cookie(
                "user_id", str(user.id), httponly=True, secure=True, samesite="Strict"
            )

        return response

    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400


@trip_bp.route("/join-trip", methods=["POST"])
def join_trip():
    # Pydantic model for this specific endpoint
    class JoinTripRequest(BaseModel):
        """Model for join trip request."""

        trip_id: int
        questions: List[QuestionAnswer]
        name: Optional[str] = None

    """
    Join an existing trip by creating a new profile for the user.

    Expects a JSON payload with:
    {
        "trip_id": 1,
        "questions": [{
            "question": "Question text",
            "answer": "Answer text"
        }, ...],
        "name": "User Name"  // Optional if user_id cookie is already set
    }

    If the user_id cookie is already set, it will use the existing user.
    Otherwise, it will create a new user and set the cookie.

    Returns JSON with user_id and profile_id.
    """
    try:
        # Validate request data with Pydantic
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        validated_data = JoinTripRequest(**data)

        # Verify the trip exists
        trip = db_session.query(Trip).filter(Trip.id == validated_data.trip_id).first()
        if not trip:
            return jsonify({"error": "Trip not found"}), 404

        # Check if user already exists via cookie
        existing_user_id = request.cookies.get("user_id")

        # Handle user creation/retrieval
        if existing_user_id:
            try:
                # Use existing user if the cookie is set
                user_id = int(existing_user_id)
                user = db_session.query(User).filter(User.id == user_id).first()

                if not user:
                    # If user doesn't exist despite having cookie, create a new user
                    if not validated_data.name:
                        return jsonify({"error": "Name is required for new users"}), 400

                    user = User(name=validated_data.name)
                    db_session.add(user)
                    db_session.flush()
                    set_cookie = True
                else:
                    set_cookie = False

                    # Check if user already has a profile for this trip
                    existing_profile = (
                        db_session.query(Profile)
                        .filter(
                            Profile.user_id == user.id,
                            Profile.trip_id == validated_data.trip_id,
                        )
                        .first()
                    )

                    if existing_profile:
                        return jsonify(
                            {
                                "error": "You are already a member of this trip",
                                "profile_id": existing_profile.id,
                            }
                        ), 400
            except ValueError:
                # If cookie value is invalid, create a new user
                if not validated_data.name:
                    return jsonify({"error": "Name is required for new users"}), 400

                user = User(name=validated_data.name)
                db_session.add(user)
                db_session.flush()
                set_cookie = True
        else:
            # Create a new user if no cookie is set
            if not validated_data.name:
                return jsonify({"error": "Name is required for new users"}), 400

            user = User(name=validated_data.name)
            db_session.add(user)
            db_session.flush()
            set_cookie = True

        # Convert Pydantic models to dictionaries for storage
        questions_data = [q.model_dump() for q in validated_data.questions]

        # Create a new profile for this trip
        profile = Profile(
            questions=questions_data, trip_id=validated_data.trip_id, user_id=user.id
        )
        db_session.add(profile)
        db_session.commit()

        # Create response object
        response = make_response(
            jsonify(
                {
                    "trip_id": validated_data.trip_id,
                    "user_id": user.id,
                    "profile_id": profile.id,
                }
            )
        )

        # Set user cookie only if it wasn't already set correctly
        if set_cookie:
            response.set_cookie(
                "user_id", str(user.id), httponly=True, secure=True, samesite="Strict"
            )

        return response

    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400
