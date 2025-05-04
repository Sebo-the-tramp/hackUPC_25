# HackUPC 2025 -- Travelero Tralala
By Sebastian, Miika, Karolina

## Pitch 💡
Travelero integrates **Skyscanner API data, Tinder-inspired preference-based matching, and AI assistance via a custom agent** to solve the complex problem of finding **optimal meeting points for international friend groups**. Our Flask backend processes flight availability data through custom algorithms that minimize group travel costs, while our Next.js frontend provides an intuitive interface for preference collection and real-time collaborative trip planning with embedded AI assistance.

## What makes our project unique? 🏆
Our project is different from the other Skyscanner Challenge submissions in many ways:
- **Custom Qwen Agent Integration** -- Our implementation integrates the Qwen large language model agent through a custom Flask endpoint (`backend/ai.py`), enabling intelligent travel recommendations. Within a trip group, each user's travel preferences, stored as JSON in our PostgreSQL database via SQLAlchemy ORM models (`backend/models.py`), are passed to the Qwen agent for context-aware responses. The agent uses this information to generate personalized recommendations, answering questions about destinations and activities while considering all group members' preferences simultaneously. <br>
For a demonstration of the standalone Qwen agent via Gradio, see this video: [https://youtu.be/HtR5K8Tt8zI](https://youtu.be/HtR5K8Tt8zI)
- **Advanced Qwen Algorithm** -- We created a custom flight optimization engine (`gradiotest/skyscanner_api.py`) that queries the Skyscanner API with the specific date ranges and origin airports of all group members. Our algorithm (`find_top_k_full_paths` function) computes a comprehensive cost matrix, identifying destinations that minimize the sum of travel costs across all participants. The system intelligently handles multi-leg journeys and self-transfer flights, significantly expanding the range of possible meeting points. 
- **Preference Collection with React-Based Tinder Interface** --
- **Real-Time Collaborative Architecture** -- Our system enables multiple users to interact simultaneously -- like Google Docs! The backend (`backend/app.py`) serves as an intermediary, storing all messages in the PostgreSQL database and retrieving them with eager loading via SQLAlchemy to minimize database queries. The chat interface (`app/components/ChatInterface.tsx`) connects to our custom /api/chat endpoint which forwards messages to the Qwen agent, maintains context across the conversation, and broadcasts responses to all connected clients. 

## The Basic User Flow 👇
![](https://i.imgur.com/NwHbxMV.png)
1. Users access the login page. We use cookies to authenticate, so no login is necessary!
--> The user chooses whether they want to view an existing trip (if one exists) or make a new trip
2.  Upon clicking "Create Trip", the user undergoes the "Tinder-like" selection system, where the system gathers information including the origin airport, passport, and travel preferences of the user.
![](https://i.imgur.com/6f2I01A.png)
3. The dashboard loads. From here, the user can access a custom AI agent chat that takes into account the preferences of all users. 
![g0Gu7LK.png (1356×870)](https://i.imgur.com/g0Gu7LK.png)
--> The user can invite new friends to the trip with a link, and they will all be able to collaboratively chat with the interface. Any new friend will be prompted to complete the "Tinder-inspired" onboarding upon clicking the link so that their preferences can be collected.

## How we built it
Frontend: Next.js 14, React, Tailwind CSS
UI Components: Custom React components with Lucide icons
Backend: Flask for API endpoints and server logic
Database: PostgreSQL with SQLAlchemy ORM
Authentication: JWT-based auth with HTTP-only cookies

## Challenges
- API Integration: Synchronizing OpenAI API calls with our Flask backend required careful error handling and rate limiting
- Real-time Chat: Implementing scrollable chat interface with proper state management proved technically challenging
- Database Schema: Designing flexible schema to accommodate varied trip details and user preferences required multiple iterations
- Authentication Flow: Balancing security with user experience when implementing JWT authentication

## What's next for Travelero
- Offline Mode: Implementing data caching for limited functionality without internet connection
- Multi-language Support: Expanding AI capabilities to handle queries in multiple languages
- Trip Sharing: Adding collaborative features for group trip planning with shared access controls
- Custom Recommendations: Enhancing AI model with fine-tuning based on user feedback and preferences
- Integration: Connecting with third-party booking APIs to enable direct reservations within the platform


## 🚀 Getting Started
### Prerequisites

This project requires the following Python packages:

```
flask>=3.1.0
flask-cors>=5.0.1
ollama>=0.4.8
openai>=1.77.0
pydantic>=2.9.2
psycopg2-binary>=2.9.10
qwen-agent[code-interpreter,gui,mcp,rag]>=0.0.21
requests>=2.32.3
sqlalchemy>=2.0.40
sqlalchemy-serializer>=1.4.12
```

You can install all prerequisites by running:

```bash
pip install -r requirements.txt
```

Next, set your environment variables:
```bash
set LLM_URL=$yoururl
set DATABASE_URL=$postgresurl
```

And run the project:

```bash
pnpm install
pnpm run dev
```


<!-- ## 🤝 Team

### 🧑‍💻 Sebastian Cavada
**Role**: Backend Developer & Algorithm Specialist
**Focus**: Implementing the flight optimization algorithms and backend infrastructure
**Goal**: Create efficient algorithms that can handle complex multi-city route calculations
**Fun Fact**: Loves finding the most efficient routes in everything, from code to travel!

### 👩‍💻 [Team Member 2]
**Role**: Frontend Developer
**Focus**: Building intuitive user interfaces and interactive maps
**Goal**: Create a seamless user experience for group travel planning
**Fun Fact**: Has visited over 20 countries and loves documenting travel experiences

### 👨‍💻 [Team Member 3]
**Role**: Data Engineer
**Focus**: API integrations and data processing
**Goal**: Ensure reliable and fast access to flight data
**Fun Fact**: Can recite airport codes from memory

### 👩‍💻 [Team Member 4]
**Role**: UX/UI Designer
**Focus**: Creating beautiful and functional interfaces
**Goal**: Make travel planning as enjoyable as the trip itself
**Fun Fact**: Designs travel itineraries as a hobby -->

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


---

Made with ❤️ at HackUPC 2025 
