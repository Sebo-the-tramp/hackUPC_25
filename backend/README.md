# Backend Service

A minimal Flask + SQLAlchemy + PostgreSQL backend for managing Users, Profiles, and Trips.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Configure your database:
   - Set the `DATABASE_URL` environment variable with your database connection string
   - Or use the default: "postgresql+psycopg2://postgres:postgres@localhost:5432/tripdb"
   - Set the `PROD` environment variable to `true` to prevent database clearing on startup

3. Run the application:
   ```
   python -m backend.app
   ```

## API Endpoints

### Create Trip
- **URL**: `/api/create-trip`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "name": "User Name",
    "trip_name": "Trip Name",
    "questions": [
      {
        "question": "Question text",
        "answer": "Answer text"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "trip_id": 1,
    "user_id": 1,
    "profile_id": 1,
    "trip_url": "http://localhost:5000/?trip_id=1"
  }
  ```
- **Cookie**: Sets a httpOnly secure cookie named `user_id` with the user's ID
- **Note**: If the user_id cookie is already set, it will use the existing user and only create a new profile and trip.

### Get Trip Info
- **URL**: `/api/trip-info`
- **Method**: GET
- **Query Parameters**: `trip_id` - The ID of the trip to fetch
- **Response**:
  ```json
  {
    "trip_name": "Trip Name",
    "creator_name": "Creator Name",
    "messages": [
      {
        "sender_name": "User Name",
        "is_ai": false,
        "content": "Message content",
        "created_at": "2023-05-03T12:34:56.789Z"
      }
    ]
  }
  ```

### Get My Trips
- **URL**: `/api/my-trips`
- **Method**: GET
- **Requires**: `user_id` cookie to be set
- **Response**:
  ```json
  {
    "trips": [
      {
        "trip_id": 1,
        "trip_name": "Trip Name",
        "creator_name": "Creator Name"
      }
    ]
  }
  ```

### Send Message
- **URL**: `/api/send-message`
- **Method**: POST
- **Requires**: `user_id` cookie to be set
- **Request Body**:
  ```json
  {
    "trip_id": 1,
    "content": "Message content"
  }
  ```
- **Response**:
  ```json
  {
    "message_id": 1,
    "status": "Message sent successfully"
  }
  ```

## Models

### User
- id: Primary key
- name: User's name
- profiles: Relationship to Profile (one-to-many)

### Profile
- id: Primary key
- questions: JSON data containing questions and answers
- user_id: Foreign key to User
- trip_id: Foreign key to Trip
- messages: Relationship to Message (one-to-many)

### Trip
- id: Primary key
- name: Trip name
- profiles: Relationship to Profile (one-to-many)
- messages: Relationship to Message (one-to-many)

### Message
- id: Primary key
- content: Message text content
- is_ai: Boolean flag indicating if message is from an AI
- created_at: Timestamp when message was created
- trip_id: Foreign key to Trip
- profile_id: Foreign key to Profile (nullable for AI messages)