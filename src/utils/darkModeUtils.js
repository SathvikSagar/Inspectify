// Utility functions for handling dark mode
export const isDarkMode = () => {
  // Check if user has set a preference in localStorage
  const userPreference = localStorage.getItem('darkMode');
  if (userPreference !== null) {
    return userPreference === 'true';
  }
  
  // If no preference, check system preference
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const toggleDarkMode = () => {
  const currentMode = isDarkMode();
  localStorage.setItem('darkMode', (!currentMode).toString());
  applyDarkMode(!currentMode);
  return !currentMode;
};

export const applyDarkMode = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Initialize dark mode on page load
export const initDarkMode = () => {
  applyDarkMode(isDarkMode());
  
  // Listen for system preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only apply if user hasn't set a preference
      if (localStorage.getItem('darkMode') === null) {
        applyDarkMode(e.matches);
      }
    });
  }
};