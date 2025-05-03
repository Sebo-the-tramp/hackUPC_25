# Backend Documentation

This document provides an overview of the backend structure and functionality for reference by the Claude Code agent.
Please refer to this file when making changes to the backend and keep it updated as modifications are made.

## Backend Overview

The backend is a Flask application with a PostgreSQL database, using SQLAlchemy as the ORM. It implements a travel
planning application that allows users to:

1. Create trips
2. Join existing trips
3. View trip information
4. Send messages within trips
5. Track user profiles for each trip

The system uses a cookie-based authentication mechanism to identify users and maintains relationships between users,
trips, profiles, and messages.

## Backend Files

| File            | Purpose                                                                                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `__init__.py`   | Package initialization file making the `backend` directory a Python package.                                                                                                                 |
| `app.py`        | Main Flask application entry point responsible for creating and configuring the Flask app, registering blueprints, initializing the database, and setting up CORS.                           |
| `db.py`         | Database configuration and initialization. Sets up the SQLAlchemy engine, session factory, and provides functions for initializing and shutting down the database.                           |
| `models.py`     | SQLAlchemy models defining the database schema: User, Trip, Profile, and Message models with their relationships.                                                                            |
| `README.md`     | Comprehensive documentation of backend architecture, database models, and API endpoints. Contains detailed descriptions of each model, their relationships, and API endpoint specifications. |
| `requests.http` | Collection of sample HTTP requests for testing the API endpoints manually.                                                                                                                   |
| `routes.py`     | API routes for the application, implementing endpoints for trip creation, trip information, user's trips, sending messages, and joining trips.                                               |

## Key Components

### Models

- **User**: Represents a person with a name who can join multiple trips
- **Trip**: Represents a travel plan with a name
- **Profile**: Represents a user's profile for a specific trip, storing answers to trip-related questions
- **Message**: Represents messages exchanged in a trip, either from users or AI

### Routes

- `/api/create-trip`: Create a new trip and user profile
- `/api/trip-info`: Get information about a trip, including messages
- `/api/my-trips`: Get all trips associated with the current user
- `/api/send-message`: Send a message to a trip
- `/api/join-trip`: Join an existing trip by creating a new profile

### Database

- Uses PostgreSQL with SQLAlchemy ORM
- Development mode resets the database on startup
- Production mode preserves the database (controlled by the PROD environment variable)

## Important Notes

1. When modifying models, remember to update the relationships between models
2. When adding new routes, follow the pattern of validating input, processing the request, and returning a structured
   response
3. The API generally uses cookies for authentication, with the `user_id` cookie being set upon creation of a user
4. In development mode, the database is reset on each application startup unless the PROD environment variable is set

