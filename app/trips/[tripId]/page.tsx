"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserCard from "../../components/UserCard";
import ChatInterface from "../../components/ChatInterface";
import TripMap from "../../components/TripMap";
import { getTripInfo } from "../../lib/api";

type TripPageProps = {
  params: {
    tripId: string;
  };
};

type Member = {
  user_id: number;
  name: string;
  profile_id: number;
  homeAirport?: string | null;
};

type Message = {
  sender_name: string;
  content: string;
  is_ai: boolean;
  created_at: string;
};

type TripData = {
  trip_name: string;
  creator_name: string;
  messages: Message[];
  is_member: boolean;
  members: Member[];
};

const TripPage: React.FC<TripPageProps> = ({ params }) => {
  const { tripId } = params;
  const router = useRouter();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    // Generate invite link
    const baseUrl = window.location.origin;
    setInviteLink(`${baseUrl}/trips/${tripId}/invite`);

    const fetchTripData = async () => {
      try {
        setLoading(true);
        const response = await getTripInfo(Number(tripId));

        if (response.error) {
          setError(response.error);
        } else {
          setTripData(response);
          
          // If user is not a member, redirect to invite page
          if (response.is_member === false) {
            router.push(`/trips/${tripId}/invite`);
          }
        }
      } catch (err) {
        setError("Failed to load trip details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, router]);

  // Handle error case
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Trip
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
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

  // Handle loading state
  if (loading || !tripData) {
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

  // Convert members to the format expected by components
  const formattedMembers = tripData.members.map(member => ({
    id: member.user_id.toString(),
    name: member.name,
    profile_id: member.profile_id,
    homeAirport: null // We don't have this info from the API yet
  }));

  // Extract creator
  const creator = {
    id: formattedMembers[0]?.id || "1",
    name: tripData.creator_name,
    profile_id: formattedMembers[0]?.profile_id,
    homeAirport: null
  };

  // Remove creator from members list to avoid duplication
  const members = formattedMembers.filter(m => m.name !== tripData.creator_name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-indigo-700">{tripData.trip_name}</h1>
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
            <UserCard user={creator} isCreator={true} tripId={tripId} />
          </div>

          {/* Top right: Friends cards */}
          <div className="bg-indigo-50 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-indigo-700">Friends</h2>
              <span className="text-sm text-indigo-600 font-medium">
                {members.length} members
              </span>
            </div>

            <div className="space-y-3 max-h-[calc(100%-3rem)] overflow-y-auto">
              {members.length > 0
                ? members.map((member) => (
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
            <ChatInterface 
              tripId={tripId} 
              initialMessages={tripData.messages.map(msg => ({
                id: Math.random().toString(),
                sender: msg.is_ai ? 'llm' : 'user',
                text: msg.content,
                timestamp: new Date(msg.created_at),
                senderName: msg.sender_name
              }))} 
            />
          </div>

          {/* Bottom right: Map */}
          <div className="z-0 bg-white rounded-lg shadow-md h-[calc(100vh-24rem)] md:h-auto">
            <TripMap
              members={[creator, ...members].filter(
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
