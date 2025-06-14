"""Message related routes for the application."""

import threading
from pydantic import BaseModel, ValidationError

from flask import Blueprint, request, jsonify, current_app
from backend.db import db_session
from backend.models import User, Profile, Message, Trip
from sqlalchemy import desc

# Import the get_ai_message function from qwen_agent.py
from backend.ai import get_ai_message

# Create Blueprint
message_bp = Blueprint("message", __name__, url_prefix="/api")


def process_ai_response(trip_id, message_id):
    """Background task to process AI response and add to conversation.
    
    Args:
        trip_id: The trip ID for which to generate an AI response
        message_id: The ID of the message that triggered this response
    """
    # Create a new session for this thread
    from backend.db import db_session
    print(f"Processing AI response for trip {trip_id} in thread {threading.current_thread().name}")
    
    try:
        # Get trip details and all users in the trip
        trip = db_session.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            print(f"Error: Trip {trip_id} not found")
            return
        
        # Get all users with their profiles for this trip
        profiles = db_session.query(Profile).filter(
            Profile.trip_id == trip_id,
            Profile.deleted == False
        ).all()
        
        
        # Get the last 10 messages for context
        messages = db_session.query(Message).filter(
            Message.trip_id == trip_id
        ).order_by(desc(Message.created_at)).limit(10).all()
        
        # Format messages for the AI model
        formatted_messages = []
        for msg in reversed(messages):  # Most recent last
            if msg.is_ai:
                formatted_messages.append({
                    "role": "assistant",
                    "content": msg.content
                })
            else:
                user_name = msg.user.name if msg.user else "Unknown"
                formatted_messages.append({
                    "role": "user",
                    "content": f"{user_name}: {msg.content}"
                })
        
        # Get socketio instance - we're now running inside an app context thanks to the wrapper
        from flask import current_app
        socketio = current_app.extensions['socketio']
        
        # Prepare user data for the AI model
        user_data = [p.to_dict(only=("user.name", "questions", "questions.question", "questions.answer")) for p in profiles]
        
        # Process user data to extract airport information
        for user_profile in user_data:
            user_profile["name"] = user_profile["user"]["name"]
            # Initialize an empty list for airports
            if 'nearest_airport' not in user_profile:
                user_profile['nearest_airport'] = []
                
            # Try to find the airport answer from questions
            if 'questions' in user_profile:
                for question in user_profile.get('questions', []):
                    # Check for airport-related questions
                    if isinstance(question, dict) and 'question' in question:
                        question_text = question.get('question', '').lower()
                        if ('airport' in question_text or 'icao' in question_text) and 'answer' in question:
                            # Get the airport answer
                            airport_code = question.get('answer')
                            if airport_code and len(airport_code.strip()) > 0:
                                # Add to nearest airport if it's not empty
                                user_profile['nearest_airport'].append(airport_code.strip()[1:])
        
        # Get AI response with streaming enabled
        ai_response = get_ai_message(
            user_data,
            formatted_messages,
            socketio=socketio,
            trip_id=trip_id
        )
        
        # Save the final AI response to the database
        if ai_response:
            new_ai_message = Message(
                content=ai_response,
                is_ai=True,
                trip_id=trip_id,
                profile_id=None  # AI messages don't have a profile
            )
            
            db_session.add(new_ai_message)
            db_session.commit()
            print(f"AI response added to trip {trip_id}")
            
            # Emit the complete message (will be used by clients that might have missed the streaming updates)
            message_data = {
                "message_id": new_ai_message.id,
                "trip_id": trip_id,
                "content": ai_response,
                "sender": {
                    "id": None,
                    "name": "AI"
                },
                "created_at": new_ai_message.created_at.isoformat() if hasattr(new_ai_message.created_at, 'isoformat') else str(new_ai_message.created_at),
                "is_ai": True
            }
            socketio.emit('new_message', message_data, room=f'trip_{trip_id}')
        else:
            print("AI response was empty or None")
            
    except Exception as e:
        print(f"Error processing AI response: {e}")
        # Import traceback to get full error details
        import traceback
        traceback.print_exc()
    finally:
        # Make sure to remove the session when done
        db_session.remove()


@message_bp.route("/send-message", methods=["POST"])
def send_message():
    class SendMessageRequest(BaseModel):
        trip_id: int
        content: str

    try:
        user_id = int(request.cookies.get("user_id"))
    except ValueError:
        return jsonify({"error": "Invalid user ID format in cookie"}), 400

    try:
        validated_data = SendMessageRequest(**request.get_json())
        # Query directly for the profile which verifies both trip and user in one go
        profile = (
            db_session.query(Profile)
            .filter(
                Profile.user_id == user_id, Profile.trip_id == validated_data.trip_id
            )
            .first()
        )

        # Handle error cases
        if not profile:
            # Check if user exists but doesn't have a profile for this trip
            user_exists = db_session.query(User).filter(User.id == user_id).first()
            if not user_exists:
                return jsonify({"error": "User not found"}), 404
            return jsonify({"error": "You are not a member of this trip"}), 403

        # Create and save the message
        new_message = Message(
            content=validated_data.content,
            is_ai=False,
            trip_id=validated_data.trip_id,
            profile_id=profile.id,
        )

        db_session.add(new_message)
        db_session.commit()
        
        # Emit the message via WebSocket, with a sender_id field for identifying who sent it
        message_data = {
            "message_id": new_message.id,
            "trip_id": validated_data.trip_id,
            "content": validated_data.content,
            "sender": {
                "id": user_id,
                "name": profile.user.name if profile.user else "Unknown"
            },
            "sender_id": user_id,  # Add explicit sender_id for client-side filtering
            "created_at": new_message.created_at.isoformat() if hasattr(new_message.created_at, 'isoformat') else str(new_message.created_at),
            "is_ai": False
        }
        # Get socketio instance from current app
        socketio = current_app.extensions['socketio']
        
        # Include the sender's socket ID when emitting to allow clients to filter out their own messages
        request_sid = request.sid if hasattr(request, 'sid') else None
        socketio.emit('new_message', message_data, room=f'trip_{validated_data.trip_id}', skip_sid=request_sid)
        
        # Get app context for background thread
        app_context = current_app._get_current_object()
        
        # Start a background thread to process the AI response with app context
        def run_with_app_context(app, trip_id, message_id):
            with app.app_context():
                process_ai_response(trip_id, message_id)
        
        thread = threading.Thread(
            target=run_with_app_context,
            args=(app_context, validated_data.trip_id, new_message.id)
        )
        thread.daemon = True  # Thread will not prevent the application from exiting
        thread.start()

        return jsonify(
            {"message_id": new_message.id, "status": "Message sent successfully"}
        )

    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400

