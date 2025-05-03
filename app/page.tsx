"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyTrips, createTrip } from "./lib/api";

type Trip = {
  id: number;
  name: string;
  creator: string;
};

export default function Home() {
  const router = useRouter();
  const [tripsLoading, setTripsLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newTripName, setNewTripName] = useState("");

  useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await getMyTrips();

        if (response.error) {
          if (
            response.error.includes("You need to create a trip") ||
            response.error.includes("No user_id cookie found")
          ) {
            // We don't redirect automatically anymore, just show empty state
            setTrips([]);
          } else {
            setError(response.error);
          }
        } else if (response.trips?.length > 0) {
          setTrips(response.trips);
        } else {
          setTrips([]);
        }
      } catch (err) {
        setError("Failed to load your trips. Please try again.");
      } finally {
        setTripsLoading(false);
      }
    }

    fetchTrips();
  }, []);

  const handleStartNewTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTripName.trim()) return;

    setCreateLoading(true);
    router.push(`/trips/new?tripName=${encodeURIComponent(newTripName)}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* Static content is always visible */}
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Travelero Tralala 🦈</h1>
        <p className="text-gray-600 mb-8 text-center">
          Plan perfect trips with friends by finding the optimal meeting point
        </p>

        {/* New trip creation form */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create a Trip</h2>
          <form onSubmit={handleStartNewTrip} className="space-y-4">
            <div>
              <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-1">
                Trip Name
              </label>
              <input
                type="text"
                id="tripName"
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
                placeholder="Summer Vacation, Europe 2025, etc."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={createLoading || !newTripName.trim()}
              className={`w-full py-3 px-4 flex justify-center items-center ${
                createLoading || !newTripName.trim()
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white font-medium rounded-lg transition duration-200`}
            >
              {createLoading ? (
                <>
                  <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Creating...
                </>
              ) : (
                "Create a New Trip"
              )}
            </button>
          </form>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Existing trips section with loading state */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Trips</h2>

          {tripsLoading ? (
            <div className="py-8 flex flex-col items-center">
              <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-indigo-600 text-sm">Loading your trips...</p>
            </div>
          ) : trips.length > 0 ? (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                  onClick={() => router.push(`/trips/${trip.id}`)}
                >
                  <h2 className="font-bold text-xl text-indigo-700">{trip.name}</h2>
                  <p className="text-sm text-gray-600">
                    Members: <b>{trip.users.map((u) => u.name).join(", ")}</b>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500">No trips found. Create your first trip above!</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-500 text-center">
          No login required - we save your preferences using cookies!
        </div>
      </div>
    </div>
  );
}
