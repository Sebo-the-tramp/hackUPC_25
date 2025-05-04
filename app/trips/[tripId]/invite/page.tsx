'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TinderSwipe from '../../../components/TinderSwipe';
import { getTripInfo, joinTrip } from '../../../lib/api';

type InvitePageProps = {
  params: {
    tripId: string;
  };
};

// Onboarding questions
const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    text: "I prefer my trips to be...",
    options: ["Carefully planned", "Spontaneous and flexible"]
  },
  {
    id: 2,
    text: "I'd rather spend money on...",
    options: ["Nice accommodations", "Experiences and activities"]
  },
  {
    id: 3,
    text: "My ideal vacation includes...",
    options: ["Relaxation", "Adventure"]
  },
  {
    id: 4,
    text: "When traveling, I prefer to eat...",
    options: ["Familiar food", "Local cuisine"]
  },
  {
    id: 5,
    text: "What is your home airport?",
    options: ["Select from dropdown", ""]  // Options aren't used for this question
  }
];

// Airport options for dropdown
const AIRPORTS = [
  { code: "JFK", name: "New York (JFK)" },
  { code: "LAX", name: "Los Angeles (LAX)" },
  { code: "ORD", name: "Chicago (ORD)" },
  { code: "LHR", name: "London (LHR)" },
  { code: "CDG", name: "Paris (CDG)" },
  { code: "SFO", name: "San Francisco (SFO)" },
  { code: "BCN", name: "Barcelona (BCN)" },
  { code: "NRT", name: "Tokyo (NRT)" },
  { code: "SYD", name: "Sydney (SYD)" },
  { code: "DXB", name: "Dubai (DXB)" }
];

const InvitePage: React.FC<InvitePageProps> = ({ params }) => {
  const { tripId } = params;
  const router = useRouter();
  
  const [step, setStep] = useState<'loading' | 'initial' | 'onboarding' | 'airport' | 'complete'>('loading');
  const [name, setName] = useState('');
  const [tripData, setTripData] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<{ questionId: number; answer: string }[]>([]);
  const [homeAirport, setHomeAirport] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        setLoading(true);
        const response = await getTripInfo(Number(tripId));

        if (response.error) {
          setError(response.error);
        } else {
          setTripData(response);
          
          // If user is already a member, redirect to trip page
          if (response.is_member === true) {
            router.push(`/trips/${tripId}`);
            return;
          }
          
          // Otherwise, show the join form
          setStep('initial');
        }
      } catch (err) {
        setError("Failed to load trip details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, router]);

  const handleJoinTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('onboarding');
  };

  const handleOnboardingComplete = (answers: { questionId: number; answer: string }[]) => {
    setUserAnswers(answers);
    
    // Check if the user chose to select airport now
    const lastAnswer = answers.find(a => a.questionId === 5);
    if (lastAnswer && lastAnswer.answer === "Select from dropdown") {
      setStep('airport');
    } else {
      // Create trip without airport
      joinTripRequest(null);
    }
  };

  const handleAirportSelect = () => {
    if (homeAirport) {
      joinTripRequest(homeAirport);
    }
  };

  const joinTripRequest = async (selectedAirport: string | null) => {
    setLoading(true);
    setError(null);

    try {
      // Format questions and answers for the API
      const formattedQuestions = userAnswers.map(answer => {
        const question = ONBOARDING_QUESTIONS.find(q => q.id === answer.questionId);
        return {
          question: question ? question.text : `Question ${answer.questionId}`,
          answer: answer.answer
        };
      });

      // Add airport question if provided
      if (selectedAirport) {
        formattedQuestions.push({
          question: "What's your home airport?",
          answer: selectedAirport
        });
      }

      // Call join-trip API
      const response = await joinTrip({
        trip_id: Number(tripId),
        name: name,
        questions: formattedQuestions
      });

      if (response.error) {
        setError(response.error);
        setLoading(false);
        return;
      }

      // Set step to complete and redirect after a delay
      setStep('complete');
      setTimeout(() => {
        router.push(`/trips/${tripId}`);
      }, 3000);
    } catch (err) {
      setError('Failed to join trip. Please try again.');
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-indigo-800 font-medium">Loading trip details...</p>
        </div>
      </div>
    );
  }

  // Show error if trip not found
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {step === 'initial' && (
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-indigo-700 mb-2">Join Trip</h1>
          <p className="text-gray-600 mb-6">
            <span className="font-semibold">{tripData.trip.users[0]?.name || 'Someone'}</span> has invited you to join "{tripData.trip.name}"!
          </p>
          
          <form onSubmit={handleJoinTrip}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your name"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200"
            >
              Continue
            </button>
          </form>
        </div>
      )}
      
      {step === 'onboarding' && (
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
          <TinderSwipe 
            questions={ONBOARDING_QUESTIONS} 
            onComplete={handleOnboardingComplete}
          />
        </div>
      )}
      
      {step === 'airport' && (
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-indigo-700 mb-6">Select Your Home Airport</h1>
          
          <div className="mb-4">
            <label htmlFor="airport" className="block text-sm font-medium text-gray-700 mb-2">
              Home Airport
            </label>
            <select
              id="airport"
              value={homeAirport}
              onChange={(e) => setHomeAirport(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select an airport</option>
              {AIRPORTS.map(airport => (
                <option key={airport.code} value={airport.code}>
                  {airport.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleAirportSelect}
            disabled={!homeAirport}
            className={`w-full py-3 px-4 ${
              homeAirport 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } font-medium rounded-lg transition duration-200`}
          >
            Join Trip
          </button>
        </div>
      )}
      
      {step === 'complete' && (
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg text-center">
          <div className="mb-4 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-green-700 mb-2">Success!</h1>
          <p className="text-gray-600 mb-4">
            You've successfully joined the trip. Redirecting you to the trip page...
          </p>
          <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-full bg-indigo-600 animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitePage;