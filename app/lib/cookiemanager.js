// Simple cookie management utilities

/**
 * Set a cookie with the given name and value
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Number of days until the cookie expires
 */
export const setCookie = (name, value, days = 30) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  };
  
  /**
   * Get a cookie value by name
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value or null if not found
   */
  export const getCookie = (name) => {
    const cookieName = `${name}=`;
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }
    
    return null;
  };
  
  /**
   * Delete a cookie by name
   * @param {string} name - Cookie name
   */
  export const deleteCookie = (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  };
  
  /**
   * Generate a unique user ID for tracking
   * @returns {string} Unique ID
   */
  export const generateUserId = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  /**
   * Check if a user is already stored in cookies
   * @returns {boolean} True if user exists
   */
  export const userExists = () => {
    return !!getCookie('travelsync_user_id');
  };
  
  /**
   * Initialize a user in cookies if one doesn't exist
   * @returns {string} User ID
   */
  export const initUser = () => {
    let userId = getCookie('travelsync_user_id');
    
    if (!userId) {
      userId = generateUserId();
      setCookie('travelsync_user_id', userId, 365); // Set for 1 year
    }
    
    return userId;
  };
  
  /**
   * Store user preferences in cookies
   * @param {object} preferences - User preferences object
   */
  export const storeUserPreferences = (preferences) => {
    setCookie('travelsync_preferences', JSON.stringify(preferences), 365);
  };
  
  /**
   * Get user preferences from cookies
   * @returns {object|null} User preferences or null if not found
   */
  export const getUserPreferences = () => {
    const preferences = getCookie('travelsync_preferences');
    return preferences ? JSON.parse(preferences) : null;
  };