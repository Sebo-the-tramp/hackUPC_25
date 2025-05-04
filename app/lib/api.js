/**
 * API client for interacting with the backend
 */

const API_BASE_URL = '/api';

/**
 * Helper function to handle API responses and errors
 * @param {Response} response - The fetch response
 * @returns {Promise<any>} - Parsed response data
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  // Check if response is JSON
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    
    if (!response.ok) {
      // Return error message from server if available
      return { 
        error: data.error || data.message || `Error: ${response.status} ${response.statusText}` 
      };
    }
    
    return data;
  } else {
    // Handle non-JSON responses
    if (!response.ok) {
      return { 
        error: `Error: ${response.status} ${response.statusText}` 
      };
    }
    
    const text = await response.text();
    return { data: text };
  }
}

/**
 * Get current user information including their trips
 * @returns {Promise<{id: number, name: string, trips: Array<import('./types').Trip>} | {error: string}>}
 */
export async function getMe() {
  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based auth
    });
    
    return handleResponse(response);
  } catch (error) {
    return { error: 'Network error. Please check your connection.' };
  }
}

/**
 * Create a new trip with a user profile
 * @param {Object} data - Trip creation data
 * @param {string} [data.name] - User name (optional if user_id cookie exists)
 * @param {string} data.trip_name - Trip name
 * @param {Array<import('./types').QuestionAnswer>} data.questions - Question answers
 * @returns {Promise<{trip_id: number, user_id: number, profile_id: number} | {error: string}>}
 */
export async function createTrip(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/create-trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include', // Important for cookie-based auth
    });
    
    return handleResponse(response);
  } catch (error) {
    return { error: 'Network error. Please check your connection.' };
  }
}

/**
 * Join an existing trip
 * @param {Object} data - Join trip data
 * @param {number} data.trip_id - Trip ID to join
 * @param {string} [data.name] - User name (optional if user_id cookie exists)
 * @param {Array<import('./types').QuestionAnswer>} data.questions - Question answers
 * @returns {Promise<{trip_id: number, user_id: number, profile_id: number} | {error: string}>}
 */
export async function joinTrip(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/join-trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include', // Important for cookie-based auth
    });
    
    return handleResponse(response);
  } catch (error) {
    return { error: 'Network error. Please check your connection.' };
  }
}

/**
 * Get information about a specific trip
 * @param {number} tripId - Trip ID
 * @returns {Promise<{trip: import('./types').Trip, is_member: boolean} | {error: string}>}
 */
export async function getTripInfo(tripId) {
  try {
    const response = await fetch(`${API_BASE_URL}/trip-info?trip_id=${tripId}`, {
      method: 'GET',
      credentials: 'include', // Important for cookie-based auth
    });
    
    return handleResponse(response);
  } catch (error) {
    return { error: 'Network error. Please check your connection.' };
  }
}

/**
 * Send a message in a trip
 * @param {Object} data - Message data
 * @param {number} data.trip_id - Trip ID
 * @param {string} data.content - Message content
 * @returns {Promise<{message_id: number, status: string} | {error: string}>}
 */
export async function sendMessage(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include', // Important for cookie-based auth
    });
    
    return handleResponse(response);
  } catch (error) {
    return { error: 'Network error. Please check your connection.' };
  }
}

/**
 * Leave a trip
 * @param {number} tripId - Trip ID to leave
 * @returns {Promise<{success: boolean, message: string} | {error: string}>}
 */
export async function leaveTrip(tripId) {
  try {
    const response = await fetch(`${API_BASE_URL}/leave-trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trip_id: tripId }),
      credentials: 'include', // Important for cookie-based auth
    });
    
    return handleResponse(response);
  } catch (error) {
    return { error: 'Network error. Please check your connection.' };
  }
}

export default {
  getMe,
  createTrip,
  joinTrip,
  getTripInfo,
  sendMessage,
  leaveTrip
};