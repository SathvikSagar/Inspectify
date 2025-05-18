// API Helper functions
import { BACKEND_URL, endpoints, getImageUrl } from './apiConfig';

// Generic fetch wrapper with error handling
export const fetchApi = async (endpoint, options = {}) => {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Authentication helpers
export const login = async (credentials) => {
  return fetchApi(endpoints.login, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const signup = async (userData) => {
  return fetchApi(endpoints.signup, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const verifyAuth = async (token) => {
  return fetchApi(endpoints.verifyAuth, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Data fetching helpers
export const getRoadEntries = async (userId = null) => {
  const endpoint = userId 
    ? `${endpoints.roadEntries}?userId=${userId}` 
    : endpoints.roadEntries;
  
  return fetchApi(endpoint);
};

export const getReportStats = async (userId = null) => {
  const endpoint = userId 
    ? `${endpoints.reportStats}?userId=${userId}` 
    : endpoints.reportStats;
  
  return fetchApi(endpoint);
};

// Image handling
export const getFullImageUrl = (imagePath) => {
  return getImageUrl(imagePath);
};

// Form submission helper
export const submitFormData = async (endpoint, formData, options = {}) => {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}/${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Form submission failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Form submission error:', error);
    throw error;
  }
};