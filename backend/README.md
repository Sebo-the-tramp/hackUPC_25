# Backend Documentation

## Overview
This document provides a comprehensive overview of the backend architecture for the Trip Planning application, including the database models, relationships, and API endpoints.

## Database Models

### User
- **Primary Key**: `id` (Integer)
- **Fields**:
  - `name` (String): User's name
- **Relationships**:
  - One-to-many with `Profile`: A user can have multiple profiles across different trips

### Trip
- **Primary Key**: `id` (Integer)
- **Fields**:
  - `name` (String): Name of the trip
- **Relationships**:
  - One-to-many with `Profile`: A trip can have multiple participants
  - One-to-many with `Message`: A trip has a chat thread with multiple messages

### Profile
- **Primary Key**: `id` (Integer)
- **Fields**:
  - `questions` (JSON): Stores questions and answers for the user's trip profile
  - `trip_id` (Foreign Key): Links to Trip model
  - `user_id` (Foreign Key): Links to User model
- **Relationships**:
  - Many-to-one with `User`: Each profile belongs to one user
  - Many-to-one with `Trip`: Each profile belongs to one trip
  - One-to-many with `Message`: A profile can send multiple messages
- **Note**: Profile serves as a join entity between User and Trip with additional metadata

### Message
- **Primary Key**: `id` (Integer)
- **Fields**:
  - `content` (String): Message content
  - `is_ai` (Boolean): Flag indicating if message is from AI
  - `created_at` (DateTime): Timestamp of message creation
  - `trip_id` (Foreign Key): Links to Trip model
  - `profile_id` (Foreign Key, nullable): Links to Profile model
- **Relationships**:
  - Many-to-one with `Trip`: Each message belongs to one trip
  - Many-to-one with `Profile`: Each message has one sender (null for AI messages)

## Entity Relationship Diagram

```
User (1) -----< Profile (N) >----- (1) Trip
                    |
                    |
                    v
                Message (N)
```

## API Endpoints

### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Description**: Simple health check to verify API is running
- **Response**: 
  ```json
  {
    "status": "OK"
  }
  ```

### Create Trip
- **URL**: `/api/create-trip`
- **Method**: `POST`
- **Description**: Creates a new trip and user profile
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
    "profile_id": 1
  }
  ```
- **Notes**:
  - Sets HTTP-only cookie for user ID
  - Uses existing user if cookie is present

### Join Trip
- **URL**: `/api/join-trip`
- **Method**: `POST`
- **Description**: Joins an existing trip by creating a new profile for the user
- **Request Body**:
  ```json
  {
    "trip_id": 1,
    "name": "User Name",  // Optional if user_id cookie is present
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
    "profile_id": 1
  }
  ```
- **Notes**:
  - Sets HTTP-only cookie for user ID if user is new
  - Uses existing user if cookie is present
  - Name is optional if user already exists
  - Prevents a user from joining the same trip multiple times

### Get Trip Information
- **URL**: `/api/trip-info`
- **Method**: `GET`
- **Parameters**: `trip_id` (query parameter)
- **Description**: Returns trip details including messages, trip members, and whether the requesting user is a member
- **Response**:
  ```json
  {
    "trip_name": "Trip Name",
    "creator_name": "Creator Name",
    "is_member": true,
    "messages": [
      {
        "sender_name": "User Name",
        "content": "Message content",
        "is_ai": false,
        "created_at": "2023-05-01T12:00:00"
      }
    ],
    "members": [
      {
        "user_id": 1,
        "name": "Creator Name",
        "profile_id": 1
      },
      {
        "user_id": 2,
        "name": "Member Name",
        "profile_id": 2
      }
    ]
  }
  ```
- **Notes**:
  - `is_member` is a boolean indicating if the user with the current user_id cookie is a member of this trip
  - Returns `false` for `is_member` if no user_id cookie is present or user is not a trip member
  - `members` is an array of all users participating in the trip, including their user_id, name, and profile_id

### Get User's Trips
- **URL**: `/api/my-trips`
- **Method**: `GET`
- **Authentication**: Requires `user_id` cookie
- **Description**: Lists all trips associated with the user
- **Response**:
  ```json
  {
    "trips": [
      {
        "id": 1,
        "name": "Trip Name",
        "creator": "Creator Name"
      }
    ]
  }
  ```

### Send Message
- **URL**: `/api/send-message`
- **Method**: `POST`
- **Authentication**: Requires `user_id` cookie
- **Request Body**:
  ```json
  {
    "trip_id": 1,
    "content": "Message content"
  }
  ```
- **Description**: Sends a message to a trip's chat
- **Response**:
  ```json
  {
    "status": "success",
    "message_id": 1
  }
  ```

## Authentication

The application uses a simple cookie-based authentication system:

- **User identification**: HTTP-only secure cookies with `SameSite=Strict`
- **Cookie name**: `user_id`
- **Creation**: Set during first trip creation
- **Validation**: Required for personal endpoints like `/api/my-trips` and `/api/send-message`
- **Security features**:
  - HTTP-only cookie prevents JavaScript access
  - Secure flag ensures transmission over HTTPS only
  - SameSite=Strict prevents CSRF attacks

## Database Connection

- **Database**: PostgreSQL
- **Connection string**: Environment variable `DATABASE_URL` or fallback to default:
  `postgresql+psycopg2://postgres:postgres@localhost:5432/tripdb`
- **Connection features**:
  - Connection pool with pre-ping enabled
  - Scoped session for thread safety
  - Explicit transaction management