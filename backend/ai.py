import os
import json5
from qwen_agent.agents import Assistant
from qwen_agent.tools.base import BaseTool, register_tool
from qwen_agent.utils.output_beautify import typewriter_print
from datetime import datetime

from agent.agent import make_bot

def get_ai_message(users, messages, socketio=None, trip_id=None):
    users_json = json5.dumps(users, ensure_ascii=False, indent=0)
    print("Getting AI message with users: ", users_json)
    bot = make_bot(users)

    response_plain_text = ""
    
    # Generate a unique message ID for streaming
    from uuid import uuid4
    message_id = str(uuid4())
    
    # If we have socketio, emit a start event
    if socketio and trip_id:
        socketio.emit('message_stream', {
            'type': 'start',
            'message_id': message_id,
            'trip_id': trip_id
        }, room=f'trip_{trip_id}')
    
    # Collect all characters from the response
    for response in bot.run(messages=messages):
        # Get the new characters
        old_text = response_plain_text
        response_plain_text = typewriter_print(response, response_plain_text)
        new_text = response_plain_text[len(old_text):]
        
        # Emit streaming update if socketio is available
        if socketio and trip_id and new_text:
            socketio.emit('message_stream', {
                'type': 'update',
                'message_id': message_id,
                'content': new_text,
                'trip_id': trip_id
            }, room=f'trip_{trip_id}')
    
    # Emit completion event if socketio is available
    if socketio and trip_id:
        socketio.emit('message_stream', {
            'type': 'end',
            'message_id': message_id,
            'trip_id': trip_id,
            'created_at': datetime.now().isoformat()
        }, room=f'trip_{trip_id}')
    
    return response_plain_text

