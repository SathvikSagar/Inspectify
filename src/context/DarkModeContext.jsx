import React, { createContext, useState, useEffect, useContext } from 'react';
import { injectDarkModeStyles, applyDarkModeToElement } from '../utils/darkModeUtils';

// Create the context
export const DarkModeContext = createContext();

// Create a provider component
export const DarkModeProvider = ({ children }) => {
  // Force dark mode to be false (disabled)
  const [darkMode, setDarkMode] = useState(false);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    // For now, we'll keep dark mode disabled
    setDarkMode(false);
    // Remove dark mode from localStorage
    localStorage.setItem('darkMode', 'false');
  };

  // Apply dark mode class to document root and handle all tailwind classes
  useEffect(() => {
    // Always ensure dark mode is disabled
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
    
    // Remove any dark mode styles
    const existingStyle = document.getElementById('dark-mode-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', 'false');
  }, []);

  return (
    <DarkModeContext.Provider value={{ darkMode: false, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Custom hook to use the dark mode context
export const useDarkMode = () => useContext(DarkModeContext);