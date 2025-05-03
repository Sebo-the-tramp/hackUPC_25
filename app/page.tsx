'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyTrips } from './lib/api';

type Trip = {
  id: number;
  name: string;
  creator: string;
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await getMyTrips();
        
        if (response.error) {
          if (response.error.includes('You need to create a trip') || 
              response.error.includes('No user_id cookie found')) {
            router.push('/trips/new');
            return;
          }
          setError(response.error);
        } else if (response.trips?.length > 0) {
          setTrips(response.trips);
        } else {
          router.push('/trips/new');
          return;
        }
      } catch (err) {
        setError('Failed to load your trips. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-indigo-800 font-medium">Loading your trips...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
          <h1 className="text-3xl font-bold text-indigo-700 mb-6">Travelero Tralala 🦈</h1>
          <p className="text-red-500 mb-8">{error}</p>
          <button
            onClick={() => router.push('/trips/new')}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Create a New Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Travelero Tralala 🦈</h1>
        <p className="text-gray-600 mb-8 text-center">
          Plan perfect trips with friends by finding the optimal meeting point
        </p>
        
        {trips.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Trips</h2>
            <div className="space-y-3">
              {trips.map((trip) => (
                <div 
                  key={trip.id}
                  className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                  onClick={() => router.push(`/trips/${trip.id}`)}
                >
                  <h3 className="font-medium text-indigo-700">{trip.name}</h3>
                  <p className="text-sm text-gray-600">Created by: {trip.creator}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button
          onClick={() => router.push('/trips/new')}
          className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200"
        >
          Create a New Trip
        </button>
        
        <div className="mt-8 text-sm text-gray-500 text-center">
          No login required - we save your preferences using cookies!
        </div>
      </div>
    </div>
  );
}