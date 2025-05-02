'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TinderSwipe from '../../components/TinderSwipe';

// Sample onboarding questions
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
  const [step, setStep] = useState<'initial' | 'onboarding' | 'airport'>('initial');
  const [tripName, setTripName] = useState('');
  const [userAnswers, setUserAnswers] = useState<{ questionId: number; answer: string }[]>([]);
  const [homeAirport, setHomeAirport] = useState('');
  
  // Sample airports (same as from your existing code)
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

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim()) return;
    setStep('onboarding');
  };

  const handleOnboardingComplete = (answers: { questionId: number; answer: string }[]) => {
    setUserAnswers(answers);
    
    // Check if the user chose to select airport now
    const lastAnswer = answers.find(a => a.questionId === 5);
    if (lastAnswer && lastAnswer.answer === "I'll select now") {
      setStep('airport');
    } else {
      // Create trip and redirect
      createTripAndRedirect();
    }
  };

  const handleAirportSelect = () => {
    createTripAndRedirect();
  };

  const createTripAndRedirect = () => {
    // In a real implementation, this would make an API call to create the trip
    
    // Generate a random trip ID for demo purposes
    const tripId = Math.random().toString(36).substring(2, 10);
    
    // Save to localStorage for persistence (in a real app, this would be server-side)
    const tripData = {
      id: tripId,
      name: tripName,
      creator: {
        id: 'user1',
        name: 'You',
        preferences: userAnswers,
        homeAirport: homeAirport || null
      },
      members: [],
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`trip_${tripId}`, JSON.stringify(tripData));
    
    // TODO LLM: Process user preferences into a one-sentence summary
    // This would be where the LLM would process the answers
    
    // Redirect to the trip page
    router.push(`/trips/${tripId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {step === 'initial' && (
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-indigo-700 mb-6">Create a New Trip</h1>
          
          <form onSubmit={handleCreateTrip}>
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
            onClick={handleAirportSelect}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Create Trip
          </button>
        </div>
      )}
    </div>
  );
}