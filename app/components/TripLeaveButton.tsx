"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface TripLeaveButtonProps {
  tripId: number;
  onTripLeft?: (tripId: number) => void;
}

const TripLeaveButton = ({ tripId, onTripLeft }: TripLeaveButtonProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeaveTrip = async () => {
    try {
      setIsLeaving(true);
      setError(null);
      
      // Call the leave-trip API endpoint with the structure matching your Flask backend
      const response = await fetch("/api/leave-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trip_id: tripId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave trip");
      }

      // Call the callback to update UI if provided
      if (onTripLeft) {
        onTripLeft(tripId);
      } else {
        // Fallback to page reload if no callback provided
        window.location.reload();
      }
    } catch (error) {
      console.error("Error leaving trip:", error);
      setError(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as Error).message 
        : "An unexpected error occurred");
    } finally {
      setIsLeaving(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="relative">
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering parent click events
          setShowConfirmation(true);
        }}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-label="Leave trip"
      >
        <X size={16} />
      </button>

      {/* Confirmation modal */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent click events
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Trip?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to leave this trip? This action cannot be undone.
            </p>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmation(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                disabled={isLeaving}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeaveTrip();
                }}
                disabled={isLeaving}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center"
              >
                {isLeaving ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Leaving...
                  </>
                ) : (
                  "Leave Trip"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripLeaveButton;