"""Trip related routes for the application."""
from flask import Blueprint, request, jsonify, url_for, make_response
from backend.db import db_session
from backend.models.models import User, Trip, Message
from sqlalchemy.orm import joinedload

# Create Blueprint
trip_bp = Blueprint('trip', __name__, url_prefix='/api')

@trip_bp.route('/create-trip', methods=['POST'])
def create_trip():
    """
    Create a new trip and user with the provided data.
    
    Expects a JSON payload with:
    {
        "name": "User Name",
        "trip_name": "Trip Name",
        "questions": [{
            "question": "Question text",
            "answer": "Answer text"
        }, ...]
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate required fields
    required_fields = ["name", "trip_name", "questions"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Create a new trip
    new_trip = Trip(name=data["trip_name"])
    db_session.add(new_trip)
    db_session.flush()  # Flush to get the trip ID
    
    # Create a new user associated with the trip
    new_user = User(
        name=data["name"],
        questions=data["questions"],
        trip_id=new_trip.id
    )
    db_session.add(new_user)
    db_session.commit()
    
    # Create response with trip URL
    trip_url = f"{request.url_root}?trip_id={new_trip.id}"
    
    # Create response object to set cookie
    response = make_response(jsonify({
        "trip_id": new_trip.id,
        "user_id": new_user.id,
        "trip_url": trip_url
    }))
    
    # Set user cookie
    response.set_cookie('user_id', str(new_user.id), httponly=True, secure=True, samesite='Strict')
    
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
        
    # Get trip with eager loading of users and messages
    trip = db_session.query(Trip).options(
        joinedload(Trip.users),
        joinedload(Trip.messages).joinedload(Message.user)
    ).filter(Trip.id == trip_id).first()
    
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
        
    # Get the creator (first user associated with the trip)
    creator = trip.users[0] if trip.users else None
    creator_name = creator.name if creator else "Unknown"
    
    # Format messages
    messages = []
    for msg in trip.messages:
        sender_name = "AI" if msg.is_ai else (msg.user.name if msg.user else "Unknown")
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
        
    # Get user with their trips
    user = db_session.query(User).filter(User.id == user_id).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Get all trips this user is part of
    user_trips = db_session.query(Trip).join(User).filter(User.id == user_id).all()
    
    # Format trips
    trips = []
    for trip in user_trips:
        # Find the creator (first user of the trip)
        creator = db_session.query(User).filter(User.trip_id == trip.id).order_by(User.id).first()
        creator_name = creator.name if creator else "Unknown"
        
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
    
    # Verify the user exists and belongs to this trip
    user = db_session.query(User).filter(User.id == user_id, User.trip_id == trip_id).first()
    if not user:
        # Check if user exists but is not part of this trip
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
        user_id=user_id
    )
    
    db_session.add(new_message)
    db_session.commit()
    
    return jsonify({
        "message_id": new_message.id,
        "status": "Message sent successfully"
    })