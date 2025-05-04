# backend/routes/qwen.py
"""Qwen agent integration for the application."""

import json
import requests
from flask import Blueprint, request, jsonify
from backend.db import db_session
from backend.models import User, Profile, Trip, Message
from pydantic import BaseModel, ValidationError
from typing import List, Dict, Any, Optional

# Create Blueprint
qwen_bp = Blueprint("qwen", __name__, url_prefix="/api")

# Define where the Qwen agent is running
QWEN_AGENT_URL = "http://localhost:8000"  # The port where Gradio server is running

@qwen_bp.route("/chat", methods=["POST"])
def chat():
    """API endpoint to communicate with the Qwen agent."""
    try:
        # Pydantic model for validation
        class ChatRequest(BaseModel):
            trip_id: int
            message: str
        
        # Validate request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        validated_data = ChatRequest(**data)
        
        # Get user ID from cookie
        user_id = request.cookies.get("user_id")
        if not user_id:
            return jsonify({"error": "No user_id cookie found"}), 401
            
        try:
            user_id = int(user_id)
        except ValueError:
            return jsonify({"error": "Invalid user ID format"}), 400
            
        # Get profile for this user in this trip
        profile = (
            db_session.query(Profile)
            .filter(Profile.user_id == user_id, Profile.trip_id == validated_data.trip_id)
            .first()
        )
        
        if not profile:
            return jsonify({"error": "User not part of this trip"}), 403
            
        # Get trip and all members' preferences
        trip = (
            db_session.query(Trip)
            .filter(Trip.id == validated_data.trip_id)
            .first()
        )
        
        if not trip:
            return jsonify({"error": "Trip not found"}), 404
            
        # Get all profiles for this trip to provide context
        all_profiles = (
            db_session.query(Profile)
            .filter(Profile.trip_id == validated_data.trip_id)
            .all()
        )
        
        # Prepare user context with preferences
        user_context = []
        for p in all_profiles:
            user = db_session.query(User).filter(User.id == p.user_id).first()
            user_context.append({
                "name": user.name,
                "preferences": p.questions
            })
            
        # Send message to Qwen agent through the stream endpoint
        # We'll use POST to /stream with the message and context
        try:
            # Format the message to send to Qwen
            stream_data = {
                "message": validated_data.message,
                "user_context": user_context
            }
            
            # Log the attempt
            print(f"Sending to Qwen agent: {json.dumps(stream_data)}")
            
            # Stream the response from Qwen agent
            response = requests.post(
                f"{QWEN_AGENT_URL}/stream",
                json=stream_data,
                stream=True
            )
            
            # Check status
            if response.status_code != 200:
                return jsonify({"error": f"Error from Qwen agent: {response.text}"}), response.status_code
                
            # Combine the streamed response chunks
            qwen_response = ""
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    qwen_response += chunk.decode("utf-8")
                    
            # Parse the response
            try:
                response_data = json.loads(qwen_response)
                ai_message = response_data.get("message", "I couldn't generate a response.")
            except json.JSONDecodeError:
                ai_message = qwen_response or "I couldn't generate a response."
                
        except requests.RequestException as e:
            return jsonify({"error": f"Failed to connect to Qwen agent: {str(e)}"}), 500
            
        # Store user message in database
        user_message = Message(
            content=validated_data.message,
            is_ai=False,
            trip_id=validated_data.trip_id,
            profile_id=profile.id
        )
        db_session.add(user_message)
        
        # Store AI response in database
        ai_message_obj = Message(
            content=ai_message,
            is_ai=True,
            trip_id=validated_data.trip_id,
            profile_id=None  # AI has no profile
        )
        db_session.add(ai_message_obj)
        db_session.commit()
        
        return jsonify({
            "response": ai_message,
            "message_id": ai_message_obj.id
        })
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@qwen_bp.route("/summarize-preferences", methods=["POST"])
def summarize_preferences():
    """Generate a summary of user preferences using Qwen agent."""
    try:
        # Pydantic model for validation
        class SummaryRequest(BaseModel):
            profile_id: int
        
        # Validate request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        validated_data = SummaryRequest(**data)
        
        # Get profile
        profile = (
            db_session.query(Profile)
            .filter(Profile.id == validated_data.profile_id)
            .first()
        )
        
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
            
        # Send preferences to Qwen agent for summarization
        try:
            # Format the prompt for Qwen
            prompt = f"Based on these travel preferences, generate a one-sentence summary of this traveler's preferences: {json.dumps(profile.questions)}"
            
            # Send request to Qwen agent
            response = requests.post(
                f"{QWEN_AGENT_URL}/stream",
                json={"message": prompt}
            )
            
            # Check status
            if response.status_code != 200:
                return jsonify({"error": f"Error from Qwen agent: {response.text}"}), response.status_code
                
            # Parse the response
            response_data = response.json()
            summary = response_data.get("message", "No summary generated.")
            
        except requests.RequestException as e:
            return jsonify({"error": f"Failed to connect to Qwen agent: {str(e)}"}), 500
            
        # Store the summary in the profile
        # First, check if the profile has a 'summary' field, add it if not
        profile_data = profile.questions
        profile_data["summary"] = summary
        profile.questions = profile_data
        db_session.commit()
        
        return jsonify({"summary": summary})
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500