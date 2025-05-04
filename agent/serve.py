from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import json
import time
import asyncio
from typing import List, Dict, Any

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the chat history
with open('chat_history_20250503_120930.json', 'r') as f:
    chat_history = json.load(f)

@app.get("/stream")
async def stream_chat():
    # Get the last message
    last_message = chat_history[-1]
    
    # Convert to string and split into chunks
    message_str = json.dumps(last_message)
    chunks = [message_str[i:i+10] for i in range(0, len(message_str), 10)]
    
    # Stream each chunk with a small delay
    for chunk in chunks:
        yield f"data: {chunk}\n\n"
        await asyncio.sleep(0.1)  # Small delay between chunks

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
