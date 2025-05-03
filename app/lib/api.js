const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const fetchOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };
  
  const response = await fetch(url, fetchOptions);
  
  if (response.status === 401) {
    return { error: 'You need to create a trip first' };
  }
  
  if (response.status === 404) {
    return { error: 'Resource not found' };
  }
  
  if (!response.ok) {
    return await response.json().catch(() => ({
      error: `HTTP error ${response.status}`,
    }));
  }
  
  return await response.json();
};

export const getMyTrips = () => apiFetch('/api/my-trips');

export const createTrip = (data) => apiFetch('/api/create-trip', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const joinTrip = (data) => apiFetch('/api/join-trip', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getTripInfo = (tripId) => apiFetch(`/api/trip-info?trip_id=${tripId}`);

export const sendMessage = (data) => apiFetch('/api/send-message', {
  method: 'POST',
  body: JSON.stringify(data),
});