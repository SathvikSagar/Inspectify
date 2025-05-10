import React, { createContext, useState, useEffect, useContext } from 'react';
import { injectDarkModeStyles, applyDarkModeToElement } from '../utils/darkModeUtils';

// Create the context
export const DarkModeContext = createContext();

// Create a provider component
export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Apply dark mode class to document root and handle all tailwind classes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
    
    // Inject global dark mode styles
    injectDarkModeStyles(darkMode);
    
    // Apply dark mode to all elements in the DOM
    applyDarkModeToElement(document.body, darkMode);
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Check for user's preferred color scheme and initialize dark mode
  useEffect(() => {
    // Check if user has previously set a preference
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedDarkMode === 'true') {
      setDarkMode(true);
    } else if (savedDarkMode === null) {
      // If no preference is saved, check system preference
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDarkMode);
    }
    
    // Set up a MutationObserver to handle dynamically added elements
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              // Apply dark mode to newly added elements
              applyDarkModeToElement(node, darkMode);
            }
          });
        }
      });
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Clean up observer on unmount
    return () => observer.disconnect();
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Custom hook to use the dark mode context
export const useDarkMode = () => useContext(DarkModeContext);