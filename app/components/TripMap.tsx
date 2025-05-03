'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Types for our component
type Airport = {
  code: string;
  name: string;
  lat: number;
  lng: number;
};

type Member = {
  id: string;
  name: string;
  homeAirport?: string | null;
};

type TripMapProps = {
  members: Member[];
};

// Sample airport data
const AIRPORTS: Airport[] = [
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

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const TripMap: React.FC<TripMapProps> = ({ members }) => {
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([20, 0]);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [mapKey, setMapKey] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [friendIcon, setFriendIcon] = useState<any | null>(null);
  const [meetingIcon, setMeetingIcon] = useState<any | null>(null);
  const [optimalMeetingPoint, setOptimalMeetingPoint] = useState<Airport | null>(null);

  // Set isClient to true once the component is mounted
  useEffect(() => {
    setIsClient(true);
    
    // Import Leaflet dynamically to avoid SSR issues
    const loadLeaflet = async () => {
      try {
        const L = await import('leaflet');
        
        // Fix Leaflet default icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
        
        // Initialize Leaflet icons
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
      } catch (error) {
        // Failed to load Leaflet, will show loading state
      }
    };
    
    loadLeaflet();
    
    // Add Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(link);
    
    return () => {
      // Remove the CSS link when component unmounts
      document.head.removeChild(link);
    };
  }, []);

  // Update map center when members change
  useEffect(() => {
    if (members.length === 0) return;
    
    updateMapCenter();
    calculateOptimalMeetingPoint();
  }, [members]);

  // Calculate map center based on member locations
  const updateMapCenter = () => {
    const membersWithAirports = members.filter(m => m.homeAirport);
    
    if (membersWithAirports.length === 0) {
      setMapCenter([20, 0]);
      setZoomLevel(2);
      return;
    }
    
    const locations = membersWithAirports
      .map(member => {
        const airport = AIRPORTS.find(a => a.code === member.homeAirport);
        return airport ? { lat: airport.lat, lng: airport.lng } : null;
      })
      .filter(Boolean) as { lat: number; lng: number }[];
    
    if (locations.length === 0) return;
    
    const sumLat = locations.reduce((sum, loc) => sum + loc.lat, 0);
    const sumLng = locations.reduce((sum, loc) => sum + loc.lng, 0);
    
    setMapCenter([
      sumLat / locations.length,
      sumLng / locations.length
    ]);
    
    // Adjust zoom level based on number of locations
    setZoomLevel(locations.length === 1 ? 5 : 2);
    
    // Force map to re-render with new center
    setMapKey(prev => prev + 1);
  };

  // Calculate optimal meeting point
  const calculateOptimalMeetingPoint = () => {
    const membersWithAirports = members.filter(m => m.homeAirport);
    
    if (membersWithAirports.length < 2) {
      setOptimalMeetingPoint(null);
      return;
    }
    
    const locations = membersWithAirports
      .map(member => {
        const airport = AIRPORTS.find(a => a.code === member.homeAirport);
        return airport ? { lat: airport.lat, lng: airport.lng } : null;
      })
      .filter(Boolean) as { lat: number; lng: number }[];
    
    if (locations.length < 2) {
      setOptimalMeetingPoint(null);
      return;
    }
    
    // Find closest airport to the center
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
    
    setOptimalMeetingPoint(nearestAirport);
  };

  // If not client-side yet or icons not loaded, show loading
  if (!isClient || !friendIcon) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Prepare member markers
  const memberMarkers = members
    .map(member => {
      if (!member.homeAirport) return null;
      
      const airport = AIRPORTS.find(a => a.code === member.homeAirport);
      if (!airport) return null;
      
      return (
        <Marker
          key={`member-${member.id}`}
          position={[airport.lat, airport.lng]}
          icon={friendIcon}
        >
          <Popup>
            <strong>{member.name}</strong> <br />
            {airport.name}
          </Popup>
        </Marker>
      );
    })
    .filter(Boolean);

  // Prepare optimal meeting point marker
  const meetingPointMarker = optimalMeetingPoint && meetingIcon ? (
    <Marker
      key="optimal-meeting-point"
      position={[optimalMeetingPoint.lat, optimalMeetingPoint.lng]}
      icon={meetingIcon}
    >
      <Popup>
        <strong>Optimal Meeting Point</strong> <br />
        {optimalMeetingPoint.name}
      </Popup>
    </Marker>
  ) : null;

  return (
    <div className="h-full w-full relative">
      {isClient && (
        <MapContainer
          key={mapKey}
          center={mapCenter}
          zoom={zoomLevel}
          style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
          minZoom={2}
          maxBounds={[[-90, -180], [90, 180]]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap={true}
          />
          
          {memberMarkers}
          {meetingPointMarker}
        </MapContainer>
      )}
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-md z-[1000]">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm">Group Members</span>
        </div>
        {optimalMeetingPoint && (
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm">Optimal Meeting Point</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripMap;