// This script can be run in the browser console to fix any localhost URLs in localStorage
// Copy and paste this entire script into your browser console when on your application

(function() {
  const backendUrl = 'https://inspectify-backend.onrender.com';
  const localUrl = 'http://localhost:5000';
  let replacements = 0;
  
  // Function to replace all occurrences of a string
  function replaceAll(str, find, replace) {
    return str.split(find).join(replace);
  }
  
  // Loop through all localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    let value = localStorage.getItem(key);
    
    // Skip if the value doesn't contain localhost
    if (!value.includes(localUrl)) continue;
    
    // Replace localhost with backend URL
    const newValue = replaceAll(value, localUrl, backendUrl);
    localStorage.setItem(key, newValue);
    
    console.log(`Fixed localStorage item: ${key}`);
    replacements++;
  }
  
  console.log(`Fixed ${replacements} localStorage items.`);
  
  // Also check sessionStorage
  replacements = 0;
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    let value = sessionStorage.getItem(key);
    
    // Skip if the value doesn't contain localhost
    if (!value || !value.includes(localUrl)) continue;
    
    // Replace localhost with backend URL
    const newValue = replaceAll(value, localUrl, backendUrl);
    sessionStorage.setItem(key, newValue);
    
    console.log(`Fixed sessionStorage item: ${key}`);
    replacements++;
  }
  
  console.log(`Fixed ${replacements} sessionStorage items.`);
  
  alert('LocalStorage and SessionStorage URLs have been updated!');
})();