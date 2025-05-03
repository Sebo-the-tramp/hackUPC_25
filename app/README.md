# Frontend Documentation

## Overview
This document provides a comprehensive overview of the frontend architecture for the Trip Planning application, including the pages, components, API interactions, and user flows.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Client-side State Management**: React useState/useEffect

## Project Structure

```
app/
├── lib/                 # Utility functions and types
│   ├── api.js           # API client for backend interactions
│   └── types.js         # TypeScript type definitions
├── components/          # Reusable UI components
│   ├── ChatInterface.tsx    # Chat UI with message handling
│   ├── TinderSwipe.tsx      # Swipeable question interface
│   ├── TripMap.tsx          # Map visualization for trip locations
│   └── UserCard.tsx         # User profile card component
├── page.tsx             # Homepage - lists user's trips or redirects to trip creation
├── trips/               # Trip-related pages
│   ├── new/
│   │   └── page.tsx     # Trip creation flow
│   └── [tripId]/        # Dynamic route for individual trips
│       ├── page.tsx     # Trip details page
│       └── invite/      # Trip invitation flow
│           └── page.tsx # Join trip page for invitees
```

## User Flow

### 1. Homepage (app/page.tsx)
- Calls the `/api/my-trips` endpoint to check for existing trips
- If user has no trips (API returns 401 or empty array), redirects to trip creation
- If user has trips, displays a list with options to view or create new trips

### 2. Trip Creation (app/trips/new/page.tsx)
- Multi-step flow:
  1. User enters trip name
  2. User enters their name
  3. User answers preference questions via TinderSwipe component
  4. Optional: User selects home airport
- Calls `/api/create-trip` with the collected data
- Redirects to the trip page upon successful creation

### 3. Trip Page (app/trips/[tripId]/page.tsx)
- Calls `/api/trip-info` with the trip ID
- If `is_member` is false, redirects to the invite page
- If `is_member` is true, displays:
  - Trip name and creator
  - Trip members list
  - Chat interface for group communication
  - Map visualization (for members with airports)
  - Invite functionality to add more members

### 4. Trip Invitation (app/trips/[tripId]/invite/page.tsx)
- Calls `/api/trip-info` to get trip details
- If user is already a member (`is_member` is true), redirects to trip page
- Otherwise, displays invitation with creator's name and trip name
- Similar multi-step flow as trip creation:
  1. User enters their name
  2. User answers preference questions
  3. Optional: User selects home airport
- Calls `/api/join-trip` with the collected data
- Redirects to the trip page upon successful joining

## Components

### ChatInterface (app/components/ChatInterface.tsx)
- Displays a chat interface with message history
- Supports sending messages via `/api/send-message` endpoint
- Handles loading and error states
- Props:
  - `tripId`: The ID of the current trip
  - `initialMessages`: Optional array of existing messages

### TinderSwipe (app/components/TinderSwipe.tsx)
- Provides a swipeable interface for answering questions
- Supports drag interactions and keyboard navigation
- Special handling for airport selection question
- Props:
  - `questions`: Array of question objects
  - `onComplete`: Callback function when all questions are answered
  - `isNewTrip`: Boolean flag for different styling on new trips

### TripMap (app/components/TripMap.tsx)
- Displays a map with markers for each member's home airport
- Calculates and shows an optimal meeting point
- Uses Leaflet for map rendering (loaded dynamically)
- Props:
  - `members`: Array of member objects with homeAirport property

### UserCard (app/components/UserCard.tsx)
- Displays user information in a card format
- Supports showing creator status, preferences, and home airport
- Includes functionality for inviting new members
- Props:
  - `user`: User object with name and preferences
  - `isCreator`: Boolean indicating if this user is the trip creator
  - `tripId`: The ID of the current trip
  - `inviteLink`: Optional link for inviting others
  - `canInvite`: Boolean indicating if this card is for inviting

## API Client (app/lib/api.js)

The API client provides methods for interacting with the backend:

### Methods
- `getMyTrips()`: Gets the user's trips list
- `createTrip(data)`: Creates a new trip
- `joinTrip(data)`: Joins an existing trip
- `getTripInfo(tripId)`: Gets information about a specific trip
- `sendMessage(data)`: Sends a message in a trip

Each method handles error states and includes credentials with requests, allowing the browser to automatically handle cookies set by the backend.

## Type Definitions (app/lib/types.js)

Defines TypeScript interfaces for common data structures:

- `Airport`: Airport information with code, name, and coordinates
- `User`: User information with preferences and home airport
- `Trip`: Trip details with creator, members, and metadata
- `Message`: Message format for chat functionality
- `Question`: Question format for TinderSwipe component

## Responsive Design

The application is fully responsive:
- Mobile-first approach with Tailwind CSS
- Grid layouts that adjust to screen size
- Touch-friendly interactions for mobile users
- Appropriate spacing and sizing for different devices

## Future Improvements

Potential areas for enhancement:
1. Implement real-time chat with WebSockets
2. Add optimistic updates for better UX during API calls
3. Implement client-side caching for trip data
4. Add flight search integration with real airport data
5. Enhance error handling and recovery options
6. Add proper authentication beyond cookies