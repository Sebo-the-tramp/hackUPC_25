'use client';

import { useState } from 'react';
import { User, Plus, Copy, Check } from 'lucide-react';

type UserCardProps = {
  user: {
    id: string;
    name: string;
    preferences?: string;
    homeAirport?: string | null;
  };
  inviteLink?: string;
  isCreator?: boolean;
  canInvite?: boolean;
  tripId: string;
};

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  inviteLink, 
  isCreator = false, 
  canInvite = false,
  tripId
}) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInviteLink = () => {
    // Generate link if not provided
    const link = inviteLink || `${window.location.origin}/trips/${tripId}/invite`;
    
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 flex items-start">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
          isCreator ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
        }`}>
          <User size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-800">{user.name}</h3>
              {isCreator && (
                <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                  Trip Creator
                </span>
              )}
            </div>
            
            {canInvite && (
              <button 
                onClick={() => setShowModal(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          
          {user.preferences && (
            <p className="text-gray-600 text-sm mt-2">
              {user.preferences}
            </p>
          )}
          
          {user.homeAirport && (
            <div className="mt-2 flex items-center">
              <span className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                {user.homeAirport}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Invite a Friend</h3>
            
            <p className="text-gray-600 mb-4">
              Share this link with your friend to invite them to join your trip:
            </p>
            
            <div className="flex items-center mb-6">
              <input
                type="text"
                readOnly
                value={inviteLink || `${window.location.origin}/trips/${tripId}/invite`}
                className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={copyInviteLink}
                className={`p-3 ${copied ? 'bg-green-500' : 'bg-indigo-600'} text-white rounded-r-lg`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserCard;