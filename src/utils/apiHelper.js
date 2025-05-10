// API Helper Functions
import { BACKEND_URL, endpoints, getImageUrl } from './apiConfig';

// Helper function for making API requests
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // Set default headers if not provided
    const headers = options.headers || {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Construct the full URL if it's a relative path
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Parse the response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Return both the response and data
    return { response, data, ok: response.ok };
  } catch (error) {
    console.error('API Request Error:', error);
    return { 
      error, 
      ok: false, 
      data: { error: error.message || 'Network error' } 
    };
  }
};

// Helper function for GET requests
export const apiGet = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

// Helper function for POST requests
export const apiPost = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, { 
    ...options, 
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  });
};

// Helper function for PUT requests
export const apiPut = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, { 
    ...options, 
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body)
  });
};

// Helper function for DELETE requests
export const apiDelete = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};

// Function to fix any localStorage URLs that might be using localhost
export const fixLocalStorageUrls = () => {
  const backendUrl = BACKEND_URL;
  const localUrl = 'http://localhost:5000';
  let replacements = 0;
  
  // Skip if we're actually using localhost
  if (backendUrl === localUrl) {
    console.log('Using localhost backend, no need to fix URLs');
    return;
  }
  
  console.log('Checking localStorage for URLs to fix...');
  
  // Function to replace all occurrences of a string
  function replaceAll(str, find, replace) {
    return str.split(find).join(replace);
  }
  
  // Loop through all localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    try {
      const key = localStorage.key(i);
      let value = localStorage.getItem(key);
      
      // Skip if the value doesn't contain localhost
      if (!value || !value.includes(localUrl)) continue;
      
      // Replace localhost with backend URL
      const newValue = replaceAll(value, localUrl, backendUrl);
      localStorage.setItem(key, newValue);
      
      console.log(`Fixed localStorage item: ${key}`);
      replacements++;
    } catch (error) {
      console.error('Error processing localStorage item:', error);
    }
  }
  
  console.log(`Fixed ${replacements} localStorage items.`);
  
  // Also check sessionStorage
  replacements = 0;
  for (let i = 0; i < sessionStorage.length; i++) {
    try {
      const key = sessionStorage.key(i);
      let value = sessionStorage.getItem(key);
      
      // Skip if the value doesn't contain localhost
      if (!value || !value.includes(localUrl)) continue;
      
      // Replace localhost with backend URL
      const newValue = replaceAll(value, localUrl, backendUrl);
      sessionStorage.setItem(key, newValue);
      
      console.log(`Fixed sessionStorage item: ${key}`);
      replacements++;
    } catch (error) {
      console.error('Error processing sessionStorage item:', error);
    }
  }
  
  console.log(`Fixed ${replacements} sessionStorage items.`);
  
  return true;
};

// Export all from apiConfig for convenience
export * from './apiConfig';