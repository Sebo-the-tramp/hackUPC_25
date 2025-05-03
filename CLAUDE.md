# Documentation

This document provides an overview of the application structure and functionality for reference by the Claude Code agent.
Please refer to this file when making changes to the application and keep it updated as modifications are made.

# Backend Documentation

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

# Frontend Documentation

## Frontend Overview

The frontend is built with Next.js (App Router) and Tailwind CSS. It provides a user interface for:

1. Creating new trips with a multi-step flow
2. Viewing and joining existing trips
3. Chatting with trip members
4. Visualizing optimal meeting points on a map
5. Inviting others to join a trip

The application uses a mobile-first, responsive design approach and communicates with the backend API via fetch requests.

## Frontend Files

| File/Directory                | Purpose                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `app/page.tsx`                | Homepage that lists the user's trips or redirects to trip creation if none exist                        |
| `app/layout.tsx`              | Root layout component that wraps all pages with common elements                                         |
| `app/lib/api.js`              | API client for making requests to the backend with methods for all API endpoints                        |
| `app/lib/types.js`            | TypeScript type definitions for common data structures (User, Trip, Message, etc.)                      |
| `app/trips/new/page.tsx`      | Multi-step flow for creating a new trip (trip name, user name, preferences, home airport)               |
| `app/trips/[tripId]/page.tsx` | Trip details page showing members, chat interface, and map visualization                                |
| `app/trips/[tripId]/invite/page.tsx` | Invitation flow for joining an existing trip (similar to trip creation)                           |
| `app/components/ChatInterface.tsx` | Chat UI component for sending and displaying messages in a trip                                      |
| `app/components/TinderSwipe.tsx`  | Swipeable question interface for answering preference questions                                    |
| `app/components/TripMap.tsx`     | Map visualization showing users' home airports and optimal meeting point                            |
| `app/components/UserCard.tsx`    | Card component displaying user info with invitation functionality                                    |

## Key Components

### Pages

- **Homepage** (`app/page.tsx`): Fetches user's trips from `/api/my-trips` endpoint. Redirects to trip creation if none exist or displays a list of existing trips.
- **Trip Creation** (`app/trips/new/page.tsx`): Multi-step flow for creating a new trip, including trip name, user name, preference questions, and optional home airport selection.
- **Trip Details** (`app/trips/[tripId]/page.tsx`): Main trip page displaying trip information, chat interface, user list, and map visualization.
- **Trip Invitation** (`app/trips/[tripId]/invite/page.tsx`): Handles the flow for joining an existing trip via an invitation link.

### Components

- **ChatInterface**: Displays message history and allows sending new messages in a trip via the `/api/send-message` endpoint.
- **TinderSwipe**: Provides a swipeable interface for answering preference questions with support for drag interactions and keyboard navigation.
- **TripMap**: Uses Leaflet to display a map with markers for member home airports and calculates an optimal meeting point.
- **UserCard**: Displays user information with preferences and home airport, includes functionality for inviting new members.

### API Client

The `app/lib/api.js` file provides methods for interacting with the backend API:

- `getMyTrips()`: Fetches the user's trips list
- `createTrip(data)`: Creates a new trip with user profile
- `joinTrip(data)`: Joins an existing trip
- `getTripInfo(tripId)`: Gets information about a specific trip
- `sendMessage(data)`: Sends a message in a trip

Each method handles error states and includes credentials with requests to maintain cookie-based authentication.

## User Flows

1. **New User Flow**:
   - User lands on homepage → Redirected to trip creation
   - User enters trip name → Enters user name → Answers preference questions → Optionally selects home airport
   - User is redirected to the trip page

2. **Existing User Flow**:
   - User lands on homepage → Sees list of trips → Selects a trip
   - User views trip details including chat history and member list
   - User can send messages or invite others to join

3. **Invitation Flow**:
   - User receives invitation link → Views trip info and creator name
   - User enters name → Answers preference questions → Optionally selects home airport
   - User is redirected to the trip page as a new member

## Important Notes

1. When modifying components, maintain the existing design patterns and styling approach
2. API interactions should follow the pattern set in `app/lib/api.js` to handle errors consistently
3. Authentication is cookie-based, managed automatically by the browser when including credentials in fetch requests
4. Some components like TripMap use dynamic imports to handle client-side rendering requirements
5. When adding new features, ensure they work on both mobile and desktop viewports

