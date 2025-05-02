"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserCard from "../../components/UserCard";
import ChatInterface from "../../components/ChatInterface";
import TripMap from "../../components/TripMap";

type TripPageProps = {
  params: {
    tripId: string;
  };
};

type Trip = {
  id: string;
  name: string;
  creator: {
    id: string;
    name: string;
    preferences?: string;
    homeAirport?: string | null;
  };
  members: {
    id: string;
    name: string;
    preferences?: string;
    homeAirport?: string | null;
  }[];
  createdAt: string;
};

const TripPage: React.FC<TripPageProps> = ({ params }) => {
  const { tripId } = params;
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    // Generate invite link
    const baseUrl = window.location.origin;
    setInviteLink(`${baseUrl}/trips/${tripId}/invite`);

    // Load trip data from localStorage (in a real app, this would be an API call)
    const tripData = localStorage.getItem(`trip_${tripId}`);

    if (tripData) {
      try {
        const parsedTrip = JSON.parse(tripData);
        setTrip(parsedTrip);
      } catch (error) {
        console.error("Error parsing trip data:", error);
      }
    }

    setLoading(false);
  }, [tripId]);

  // Handle case where trip doesn't exist
  if (!loading && !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Trip Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The trip you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-indigo-800 font-medium">
            Loading trip details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-indigo-700">{trip.name}</h1>
            <button
              onClick={() => router.push("/")}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
          {/* Top left: Creator card */}
          <div className="bg-indigo-50 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-indigo-700 mb-3">
              Trip Creator
            </h2>
            <UserCard user={trip.creator} isCreator={true} tripId={tripId} />
          </div>

          {/* Top right: Friends cards */}
          <div className="bg-indigo-50 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-indigo-700">Friends</h2>
              <span className="text-sm text-indigo-600 font-medium">
                {trip.members.length} members
              </span>
            </div>

            <div className="space-y-3 max-h-[calc(100%-3rem)] overflow-y-auto">
              {trip.members.length > 0
                ? trip.members.map((member) => (
                    <UserCard key={member.id} user={member} tripId={tripId} />
                  ))
                : null}

              {/* Always show an invite card at the end */}
              <UserCard
                user={{ id: "add", name: "Invite Friends" }}
                inviteLink={inviteLink}
                canInvite={true}
                tripId={tripId}
              />
            </div>
          </div>

          {/* Bottom left: Chat interface */}
          <div className="bg-white rounded-lg shadow-md h-[calc(100vh-24rem)] md:h-auto">
            <ChatInterface tripId={tripId} />
          </div>

          {/* Bottom right: Map */}
          <div className="bg-white rounded-lg shadow-md h-[calc(100vh-24rem)] md:h-auto">
            <TripMap
              members={[trip.creator, ...trip.members].filter(
                (member) => !!member.homeAirport
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripPage;
