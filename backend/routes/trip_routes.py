"""Trip related routes for the application."""
from flask import Blueprint, request, jsonify, url_for, make_response
from backend.db import db_session
from backend.models.models import User, Profile, Trip, Message
from sqlalchemy.orm import joinedload

# Create Blueprint
trip_bp = Blueprint('trip', __name__, url_prefix='/api')

@trip_bp.route('/create-trip', methods=['POST'])
def create_trip():
    """
    Create a new trip and user profile with the provided data.
    
    Expects a JSON payload with:
    {
        "name": "User Name",
        "trip_name": "Trip Name",
        "questions": [{
            "question": "Question text",
            "answer": "Answer text"
        }, ...]
    }
    
    If the user_id cookie is already set, it will use the existing user.
    Otherwise, it will create a new user and set the cookie.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate required fields
    required_fields = ["name", "trip_name", "questions"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Check if user already exists via cookie
    existing_user_id = request.cookies.get('user_id')
    
    # Create a new trip
    new_trip = Trip(name=data["trip_name"])
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
                user = User(name=data["name"])
                db_session.add(user)
                db_session.flush()
                set_cookie = True
            else:
                set_cookie = False
        except ValueError:
            # If cookie value is invalid, create a new user
            user = User(name=data["name"])
            db_session.add(user)
            db_session.flush()
            set_cookie = True
    else:
        # Create a new user if no cookie is set
        user = User(name=data["name"])
        db_session.add(user)
        db_session.flush()
        set_cookie = True
    
    # Create a new profile for this trip
    profile = Profile(
        questions=data["questions"],
        trip_id=new_trip.id,
        user_id=user.id
    )
    db_session.add(profile)
    db_session.commit()
    
    # Create response with trip URL
    trip_url = f"{request.url_root}?trip_id={new_trip.id}"
    
    # Create response object
    response = make_response(jsonify({
        "trip_id": new_trip.id,
        "user_id": user.id,
        "profile_id": profile.id,
        "trip_url": trip_url
    }))
    
    # Set user cookie only if it wasn't already set correctly
    if set_cookie:
        response.set_cookie('user_id', str(user.id), httponly=True, secure=True, samesite='Strict')
    
    return response
    
@trip_bp.route('/trip-info', methods=['GET'])
def trip_info():
    """
    Get trip information including messages.
    
    Query parameters:
    - trip_id: The ID of the trip to fetch
    
    Returns JSON with trip information, creator name, and messages.
    """
    trip_id = request.args.get('trip_id')
    
    if not trip_id:
        return jsonify({"error": "Missing required query parameter: trip_id"}), 400
        
    try:
        trip_id = int(trip_id)
    except ValueError:
        return jsonify({"error": "Invalid trip ID format"}), 400
        
    # Get trip with eager loading of profiles and messages
    trip = db_session.query(Trip).options(
        joinedload(Trip.profiles).joinedload(Profile.user),
        joinedload(Trip.messages).joinedload(Message.profile)
    ).filter(Trip.id == trip_id).first()
    
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
        
    # Get the creator (first profile associated with the trip)
    creator_profile = trip.profiles[0] if trip.profiles else None
    creator_name = creator_profile.user.name if creator_profile and creator_profile.user else "Unknown"
    
    # Format messages
    messages = []
    for msg in trip.messages:
        if msg.is_ai:
            sender_name = "AI"
        else:
            sender_name = (msg.profile.user.name if msg.profile and msg.profile.user else "Unknown")
            
        messages.append({
            "sender_name": sender_name,
            "is_ai": msg.is_ai,
            "content": msg.content,
            "created_at": msg.created_at.isoformat()
        })
    
    # Sort messages by creation time
    messages.sort(key=lambda x: x["created_at"])
    
    return jsonify({
        "trip_name": trip.name,
        "creator_name": creator_name,
        "messages": messages
    })
    
@trip_bp.route('/my-trips', methods=['GET'])
def my_trips():
    """
    Get all trips associated with the current user.
    
    Requires a user_id cookie to be set.
    
    Returns JSON with list of trips the user is part of.
    """
    # Get user ID from cookie
    user_id = request.cookies.get('user_id')
    
    if not user_id:
        return jsonify({"error": "No user_id cookie found. Please create a trip first."}), 401
        
    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"error": "Invalid user ID format in cookie"}), 400
        
    # Get user with their profiles
    user = db_session.query(User).filter(User.id == user_id).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Get all trips this user is part of through their profiles
    user_trips = db_session.query(Trip) \
        .join(Profile) \
        .filter(Profile.user_id == user_id) \
        .all()
    
    # Format trips
    trips = []
    for trip in user_trips:
        # Find the creator (first profile of the trip)
        creator_profile = db_session.query(Profile) \
            .filter(Profile.trip_id == trip.id) \
            .order_by(Profile.id) \
            .first()
            
        if creator_profile:
            creator = db_session.query(User).filter(User.id == creator_profile.user_id).first()
            creator_name = creator.name if creator else "Unknown"
        else:
            creator_name = "Unknown"
        
        trips.append({
            "trip_id": trip.id,
            "trip_name": trip.name,
            "creator_name": creator_name
        })
    
    return jsonify({
        "trips": trips
    })
    
@trip_bp.route('/send-message', methods=['POST'])
def send_message():
    """
    Send a message to a trip.
    
    Expects a JSON payload with:
    {
        "trip_id": 1,
        "content": "Message content"
    }
    
    Requires a user_id cookie to be set.
    """
    # Get user ID from cookie
    user_id = request.cookies.get('user_id')
    
    if not user_id:
        return jsonify({"error": "No user_id cookie found. Please create a trip first."}), 401
        
    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"error": "Invalid user ID format in cookie"}), 400
    
    # Get request data
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate required fields
    required_fields = ["trip_id", "content"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        trip_id = int(data["trip_id"])
    except ValueError:
        return jsonify({"error": "Invalid trip ID format"}), 400
    
    # Verify the trip exists
    trip = db_session.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    
    # Verify the user exists and has a profile for this trip
    profile = db_session.query(Profile).filter(
        Profile.user_id == user_id,
        Profile.trip_id == trip_id
    ).first()
    
    if not profile:
        # Check if user exists but doesn't have a profile for this trip
        user_exists = db_session.query(User).filter(User.id == user_id).first()
        if user_exists:
            return jsonify({"error": "You are not a member of this trip"}), 403
        else:
            return jsonify({"error": "User not found"}), 404
    
    # Create and save the message
    new_message = Message(
        content=data["content"],
        is_ai=False,
        trip_id=trip_id,
        profile_id=profile.id
    )
    
    db_session.add(new_message)
    db_session.commit()
    
    return jsonify({
        "message_id": new_message.id,
        "status": "Message sent successfully"
    })