// API Configuration Utility

// Get the backend URL from environment variables or fallback to localhost
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Helper function to create full API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${BACKEND_URL}/${cleanEndpoint}`;
};

// Socket.io configuration
export const getSocketUrl = () => BACKEND_URL;

// Log the backend URL being used (for debugging)
console.log("Using backend URL:", BACKEND_URL);