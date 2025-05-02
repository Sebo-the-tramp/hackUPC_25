'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TinderSwipe from '../../../components/TinderSwipe';

type InvitePageProps = {
  params: {
    tripId: string;
  };
};

// Sample onboarding questions (updated last question to integrate airport selection)
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

const InvitePage: React.FC<InvitePageProps> = ({ params }) => {
  const { tripId } = params;
  const router = useRouter();
  
  const [step, setStep] = useState<'initial' | 'onboarding' | 'complete'>('initial');
  const [name, setName] = useState('');
  const [trip, setTrip] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<{ questionId: number; answer: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load trip data from localStorage (in a real app, this would be an API call)
    const tripData = localStorage.getItem(`trip_${tripId}`);
    
    if (tripData) {
      try {
        const parsedTrip = JSON.parse(tripData);
        setTrip(parsedTrip);
      } catch (error) {
        console.error('Error parsing trip data:', error);
        setError('Could not load trip information. The trip may not exist.');
      }
    } else {
      setError('Trip not found. Please check the invite link and try again.');
    }
  }, [tripId]);

  const handleJoinTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('onboarding');
  };

  const handleOnboardingComplete = (answers: { questionId: number; answer: string }[]) => {
    setUserAnswers(answers);
    addMemberToTrip(answers);
  };

  const addMemberToTrip = (answers: { questionId: number; answer: string }[]) => {
    if (!trip) return;
    
    // Generate a random member ID
    const memberId = Math.random().toString(36).substring(2, 10);
    
    // Find the airport answer (last question, id 5)
    const airportAnswer = answers.find(a => a.questionId === 5);
    const homeAirport = airportAnswer ? airportAnswer.answer : '';
    
    // Add the new member to the trip
    const newMember = {
      id: memberId,
      name: name,
      preferences: null, // This would be set by the LLM in a real implementation
      homeAirport: homeAirport || null
    };
    
    // TODO LLM: Process user preferences into a one-sentence summary
    // In a real implementation, this would call the LLM API to generate a preference summary
    
    const updatedTrip = {
      ...trip,
      members: [...trip.members, newMember]
    };
    
    // Save updated trip to localStorage
    localStorage.setItem(`trip_${tripId}`, JSON.stringify(updatedTrip));
    
    // Set step to complete and redirect after a delay
    setStep('complete');
    setTimeout(() => {
      router.push(`/trips/${tripId}`);
    }, 3000);
  };

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

  // Show loading while trip is being fetched
  if (!trip && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-indigo-800 font-medium">Loading trip details...</p>
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
            You've been invited to join "{trip?.name}"!
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