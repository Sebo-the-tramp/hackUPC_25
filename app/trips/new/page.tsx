'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TinderSwipe from '../../components/TinderSwipe';
import { createTrip } from '../../lib/api';

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
    text: "What's your home airport?",
    options: ["I'll select later", "I'll select now"]
  }
];

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

export default function NewTrip() {
  const router = useRouter();
  const [step, setStep] = useState<'initial' | 'name' | 'onboarding' | 'airport'>('initial');
  const [userName, setUserName] = useState('');
  const [tripName, setTripName] = useState('');
  const [userAnswers, setUserAnswers] = useState<{ questionId: number; answer: string }[]>([]);
  const [homeAirport, setHomeAirport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetTripName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim()) return;
    setStep('name');
  };

  const handleSetUserName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    setStep('onboarding');
  };

  const handleOnboardingComplete = (answers: { questionId: number; answer: string }[]) => {
    setUserAnswers(answers);
    
    const lastAnswer = answers.find(a => a.questionId === 5);
    if (lastAnswer && lastAnswer.answer === "I'll select now") {
      setStep('airport');
    } else {
      createTripAndRedirect(null);
    }
  };

  const createTripAndRedirect = async (selectedAirport: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const formattedQuestions = userAnswers.map(answer => ({
        question: ONBOARDING_QUESTIONS.find(q => q.id === answer.questionId)?.text || `Question ${answer.questionId}`,
        answer: answer.answer
      }));

      if (selectedAirport) {
        formattedQuestions.push({
          question: "What's your home airport?",
          answer: selectedAirport
        });
      }

      const response = await createTrip({
        name: userName,
        trip_name: tripName,
        questions: formattedQuestions
      });

      if (response.error) {
        setError(response.error);
        setLoading(false);
        return;
      }

      router.push(`/trips/${response.trip_id}`);
    } catch (err) {
      setError('Failed to create trip. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-indigo-800 font-medium">Creating your trip...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {error && (
        <div className="w-full max-w-md mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {step === 'initial' && (
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-indigo-700 mb-6">Create a New Trip</h1>
          
          <form onSubmit={handleSetTripName}>
            <div className="mb-4">
              <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-2">
                Trip Name
              </label>
              <input
                type="text"
                id="tripName"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Summer Vacation, Europe 2025, etc."
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

      {step === 'name' && (
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-indigo-700 mb-6">Your Name</h1>
          
          <form onSubmit={handleSetUserName}>
            <div className="mb-4">
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
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
            isNewTrip={true}
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
            onClick={() => homeAirport && createTripAndRedirect(homeAirport)}
            disabled={!homeAirport}
            className={`w-full py-3 px-4 ${
              homeAirport 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } font-medium rounded-lg transition duration-200`}
          >
            Create Trip
          </button>
        </div>
      )}
    </div>
  );
}