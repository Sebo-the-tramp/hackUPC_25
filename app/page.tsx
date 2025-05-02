'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const createNewTrip = () => {
    router.push('/trips/new');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6">TravelSync</h1>
        <p className="text-gray-600 mb-8">
          Plan perfect trips with friends by finding the optimal meeting point
        </p>
        
        <div className="space-y-4">
          <button
            onClick={createNewTrip}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Create a New Trip
          </button>
          
          {/* Placeholder for future features */}
          <button
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition duration-200"
            disabled
          >
            View Your Trips
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          No login required - we save your preferences using cookies!
        </div>
      </div>
    </div>
  );
}