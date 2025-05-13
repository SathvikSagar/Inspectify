// API Configuration Utility

// Get the backend URL from environment variables or fallback to local development URL
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Helper function to create full API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${BACKEND_URL}/${cleanEndpoint}`;
};

// Helper for image URLs
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // If the path already includes the backend URL, return it as is
  if (imagePath.startsWith('http')) return imagePath;
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  return `${BACKEND_URL}/${cleanPath}`;
};

// Helper for API endpoints
export const endpoints = {
  login: `${BACKEND_URL}/api/login`,
  signup: `${BACKEND_URL}/api/signup`,
  generateOtp: `${BACKEND_URL}/api/generate-otp`,
  verifyOtp: `${BACKEND_URL}/api/verify-otp`,
  verifyAuth: `${BACKEND_URL}/api/verify-auth`,
  feedback: `${BACKEND_URL}/api/feedback`,
  roadEntries: `${BACKEND_URL}/api/road-entries`,
  predict: `${BACKEND_URL}/predict`,
  analyzeDamage: `${BACKEND_URL}/analyze-damage`,
  saveCanvas: `${BACKEND_URL}/save-canvas`,
  reportStats: `${BACKEND_URL}/api/report-stats`,
  weeklyReports: `${BACKEND_URL}/api/weekly-reports`,
  damageDistribution: `${BACKEND_URL}/api/damage-distribution`,
  severityBreakdown: `${BACKEND_URL}/api/severity-breakdown`,
  recentReports: `${BACKEND_URL}/api/recent-reports`,
  roadStats: `${BACKEND_URL}/api/road-stats`,
  reviewImage: `${BACKEND_URL}/api/review-image-v2`,
  userNotification: `${BACKEND_URL}/api/user-notification`,
  feedbacks: `${BACKEND_URL}/api/feedbacks`
};

// Socket.io configuration
export const getSocketUrl = () => BACKEND_URL;

// Create a mock socket for development when backend is unavailable
export const createMockSocket = () => ({
  on: () => {},
  off: () => {},
  emit: () => {},
  connect: () => {},
  disconnect: () => {}
});

// Log the backend URL being used (for debugging)
console.log("Using backend URL:", BACKEND_URL);