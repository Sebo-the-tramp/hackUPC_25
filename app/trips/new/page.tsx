'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function NewTrip() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'initial' | 'name' | 'onboarding' | 'airport'>('initial');
  const [userName, setUserName] = useState('');
  const [tripName, setTripName] = useState('');
  const [userAnswers, setUserAnswers] = useState<{ questionId: number; answer: string }[]>([]);
  const [airportCode, setAirportCode] = useState('');
  const [airportName, setAirportName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingAirport, setValidatingAirport] = useState(false);
  const [airportError, setAirportError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Check for tripName in URL params when component mounts
  useEffect(() => {
    const tripNameFromURL = searchParams.get('tripName');
    if (tripNameFromURL) {
      setTripName(tripNameFromURL);
      setStep('name'); // Skip to the name step if trip name is provided
    }
  }, [searchParams]);

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

  const validateAirportCode = async () => {
    if (!airportCode.trim() || airportCode.length !== 4) {
      setAirportError('Please enter a valid 4-letter ICAO airport code');
      return false;
    }
  
    setValidatingAirport(true);
    setAirportError(null);
  
    try {
      const response = await fetch(`/api/validate-airport?code=${airportCode.toUpperCase()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setAirportError('Airport code not found. Please check and try again.');
        } else {
          setAirportError(`Error validating airport: ${response.statusText}`);
        }
        setValidatingAirport(false);
        return false;
      }
  
      const data = await response.json();
      
      setAirportName(data.name ? `${data.name} (${data.city}, ${data.country})` : airportCode.toUpperCase());
      setValidatingAirport(false);
      return true;
    } catch (err) {
      setAirportError('Failed to validate airport code. Please try again.');
      setValidatingAirport(false);
      return false;
    }
  };

  const handleAirportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateAirportCode();
    if (isValid) {
      createTripAndRedirect(airportCode.toUpperCase());
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
          <h1 className="text-2xl font-bold text-indigo-700 mb-6">Enter Your Home Airport ICAO Code</h1>
          
          <form onSubmit={handleAirportSubmit}>
            <div className="mb-4">
              <label htmlFor="airportCode" className="block text-sm font-medium text-gray-700 mb-2">
                ICAO Airport Code (e.g., KJFK, EGLL, LFPG)
              </label>
              <input
                type="text"
                id="airportCode"
                value={airportCode}
                onChange={(e) => {
                  setAirportCode(e.target.value.toUpperCase());
                  setAirportError(null);
                  setAirportName('');
                }}
                className={`w-full p-3 border ${
                  airportError ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase`}
                placeholder="Enter 4-letter ICAO code"
                maxLength={4}
                autoComplete="off"
                required
              />
              {airportError && (
                <p className="mt-2 text-sm text-red-600">{airportError}</p>
              )}
              {airportName && !airportError && (
                <p className="mt-2 text-sm text-green-600">Found: {airportName}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={validatingAirport}
              className={`w-full py-3 px-4 ${
                validatingAirport 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } font-medium rounded-lg transition duration-200`}
            >
              {validatingAirport ? 'Validating...' : 'Create Trip'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}