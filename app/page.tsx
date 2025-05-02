'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

// Need to fix Leaflet marker icon issue in Next.js
// In a real project, you'd need to import these CSS files
// import 'leaflet/dist/leaflet.css';

// Simulated airport API data
const AIRPORTS = [
  { code: "JFK", name: "New York (JFK)", lat: 40.6413, lng: -73.7781 },
  { code: "LAX", name: "Los Angeles (LAX)", lat: 33.9416, lng: -118.4085 },
  { code: "ORD", name: "Chicago (ORD)", lat: 41.9742, lng: -87.9073 },
  { code: "LHR", name: "London (LHR)", lat: 51.4694, lng: -0.4502 },
  { code: "CDG", name: "Paris (CDG)", lat: 49.0097, lng: 2.5479 },
  { code: "SFO", name: "San Francisco (SFO)", lat: 37.6213, lng: -122.3790 },
  { code: "BCN", name: "Barcelona (BCN)", lat: 41.2974, lng: 2.0833 },
  { code: "NRT", name: "Tokyo (NRT)", lat: 35.7720, lng: 140.3929 },
  { code: "SYD", name: "Sydney (SYD)", lat: -33.9399, lng: 151.1753 },
  { code: "DXB", name: "Dubai (DXB)", lat: 25.2532, lng: 55.3657 }
];

// This component must be a client component
const GroupMeetupOptimizer = () => {
  // State for friends list with default 2 friends
  const [friends, setFriends] = useState([
    { id: 1, name: "", airportCode: "" },
    { id: 2, name: "", airportCode: "" }
  ]);
  
  // State for map center and markers
  const [mapCenter, setMapCenter] = useState({ lat: 20, lng: 0 });
  const [zoomLevel, setZoomLevel] = useState(2);
  const [optimizedPoint, setOptimizedPoint] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState({});
  const [mapKey, setMapKey] = useState(0); // Used to force map re-render

  // Custom marker icons
  const [friendIcon, setFriendIcon] = useState(null);
  const [meetingIcon, setMeetingIcon] = useState(null);

  // Initialize Leaflet icons
  useEffect(() => {
    // In a real implementation, you'd use proper icon URLs
    setFriendIcon(
      new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    );

    setMeetingIcon(
      new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    );
  }, []);

  // Update map center when airport selections change (not when names change)
  useEffect(() => {
    updateMapCenter();
  }, [friends.map(f => f.airportCode).join(',')]); // Only depend on airport codes

  // Function to add a new friend
  const addFriend = () => {
    const newId = Math.max(...friends.map(f => f.id), 0) + 1;
    setFriends([...friends, { id: newId, name: "", airportCode: "" }]);
  };

  // Function to remove a friend
  const removeFriend = (id) => {
    if (friends.length <= 2) return; // Maintain minimum 2 friends
    setFriends(friends.filter(friend => friend.id !== id));
  };

  // Function to update friend information
  const updateFriend = (id, field, value) => {
    setFriends(friends.map(friend => 
      friend.id === id ? { ...friend, [field]: value } : friend
    ));
    
    // Force map re-render only when changing airport (not when changing name)
    if (field === 'airportCode') {
      setMapKey(prev => prev + 1);
    }
  };

  // Calculate map center based on friend locations
  const updateMapCenter = () => {
    const validFriends = friends.filter(friend => friend.airportCode);
    
    if (validFriends.length === 0) {
      setMapCenter({ lat: 20, lng: 0 });
      setZoomLevel(2);
      return;
    }
    
    const locations = validFriends.map(friend => {
      const airport = AIRPORTS.find(a => a.code === friend.airportCode);
      return airport ? { lat: airport.lat, lng: airport.lng } : null;
    }).filter(loc => loc !== null);
    
    if (locations.length === 0) return;
    
    const sumLat = locations.reduce((sum, loc) => sum + loc.lat, 0);
    const sumLng = locations.reduce((sum, loc) => sum + loc.lng, 0);
    
    setMapCenter({
      lat: sumLat / locations.length,
      lng: sumLng / locations.length
    });
    
    // Adjust zoom level based on number of locations
    if (locations.length === 1) {
      setZoomLevel(5);
    } else {
      setZoomLevel(2);
    }
    
    // Force map to re-render with new center
    setMapKey(prev => prev + 1);
  };

  // Calculate optimal meeting point
  const calculateOptimalMeetingPoint = () => {
    const validFriends = friends.filter(f => f.name && f.airportCode);
    
    if (validFriends.length < 2) {
      alert("Please add at least 2 friends with names and airports.");
      return;
    }
    
    // For now, just use the center as the "optimal" point
    // In a real app, this would be a more sophisticated algorithm
    const locations = validFriends.map(friend => {
      const airport = AIRPORTS.find(a => a.code === friend.airportCode);
      return airport ? { lat: airport.lat, lng: airport.lng } : null;
    }).filter(loc => loc !== null);
    
    if (locations.length < 2) {
      alert("Please select valid airports for at least 2 friends.");
      return;
    }
    
    // Find closest airport to the center (simple algorithm)
    const sumLat = locations.reduce((sum, loc) => sum + loc.lat, 0);
    const sumLng = locations.reduce((sum, loc) => sum + loc.lng, 0);
    
    const center = {
      lat: sumLat / locations.length,
      lng: sumLng / locations.length
    };
    
    // Find nearest airport to the center
    let nearestAirport = null;
    let minDistance = Infinity;
    
    AIRPORTS.forEach(airport => {
      const distance = Math.sqrt(
        Math.pow(airport.lat - center.lat, 2) + 
        Math.pow(airport.lng - center.lng, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestAirport = airport;
      }
    });
    
    setOptimizedPoint(nearestAirport);
    setMapCenter(center);
    setZoomLevel(2);
    setMapKey(prev => prev + 1); // Force map re-render
  };

  // Toggle dropdown for a specific friend
  const toggleDropdown = (id) => {
    setIsDropdownOpen({
      ...isDropdownOpen,
      [id]: !isDropdownOpen[id]
    });
  };

  // Get friend markers for the map
  const getFriendMarkers = () => {
    if (!friendIcon) return null;
    
    return friends
      .filter(f => f.airportCode)
      .map(friend => {
        const airport = AIRPORTS.find(a => a.code === friend.airportCode);
        if (!airport) return null;
        
        return (
          <Marker
            key={`friend-${friend.id}`}
            position={[airport.lat, airport.lng]}
            icon={friendIcon}
          >
            <Popup>
              {friend.name || "Friend"} <br />
              {airport.name}
            </Popup>
          </Marker>
        );
      });
  };

  // Get the optimized meeting point marker
  const getOptimizedMarker = () => {
    if (!optimizedPoint || !meetingIcon) return null;
    
    return (
      <Marker
        key="optimized-meeting-point"
        position={[optimizedPoint.lat, optimizedPoint.lng]}
        icon={meetingIcon}
      >
        <Popup>
          <strong>Optimal Meeting Point</strong> <br />
          {optimizedPoint.name}
        </Popup>
      </Marker>
    );
  };

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* Leaflet Map - Now covers the full screen with zoom controls at bottom left */}
      <div className="w-full h-full absolute inset-0" style={{ zIndex: 0, backgroundColor: "#aad3df" }}>
        {/* Only render the map once the icons are loaded */}
        {friendIcon && (
          <MapContainer
            key={mapKey}
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={zoomLevel}
            minZoom={2} // Restrict minimum zoom level to prevent zooming out too far
            maxBounds={[[-90, -180], [90, 180]]} // Restrict map panning within world bounds
            style={{ height: "100%", width: "100%", background: "#aad3df" }}
            zoomControl={false} // Disable default zoom control
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              noWrap={true} // Prevent the map from repeating horizontally
            />
            {/* Add ZoomControl with position="bottomleft" */}
            <ZoomControl position="bottomleft" />
            {getFriendMarkers()}
            {getOptimizedMarker()}
          </MapContainer>
        )}
      </div>
      
      {/* Friends Management Panel - Now with a higher z-index to ensure it stays on top */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-xl w-80 p-4 max-h-[90vh] overflow-visible" style={{ zIndex: 1000 }}>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Group Meetup Optimizer</h1>
        
        <div className="space-y-4">
          {friends.map(friend => (
            <div key={friend.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Friend {friend.id}</h3>
                {friends.length > 2 && (
                  <button 
                    onClick={() => removeFriend(friend.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={friend.name}
                  onChange={e => updateFriend(friend.id, 'name', e.target.value)}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
              
              <div className="relative">
                <div 
                  className="flex justify-between items-center w-full p-2 border rounded cursor-pointer bg-white"
                  onClick={() => toggleDropdown(friend.id)}
                >
                  <span className="text-gray-700">
                    {friend.airportCode 
                      ? AIRPORTS.find(a => a.code === friend.airportCode)?.name
                      : "Select Airport"}
                  </span>
                  {isDropdownOpen[friend.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                
                {isDropdownOpen[friend.id] && (
                  <div className="absolute z-20 w-full mt-1 bg-white text-black border border-gray-400 rounded-md shadow-lg overflow-visible">
                    {AIRPORTS.map(airport => (
                      <div
                        key={airport.code}
                        className={`p-2 hover:bg-gray-100 cursor-pointer ${
                          friend.airportCode === airport.code ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          updateFriend(friend.id, 'airportCode', airport.code);
                          toggleDropdown(friend.id);
                        }}
                      >
                        {airport.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-between">
          <button
            onClick={addFriend}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus size={16} className="mr-1" />
            Add Friend
          </button>
          
          <button
            onClick={calculateOptimalMeetingPoint}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
          >
            Go!
          </button>
        </div>
        
        {optimizedPoint && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-800">Optimal Meeting Location:</h3>
            <p className="text-green-700">{optimizedPoint.name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupMeetupOptimizer;