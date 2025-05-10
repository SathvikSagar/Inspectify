import React from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import './DarkModeToggle.css';

const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <button 
      onClick={toggleDarkMode}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center focus:outline-none dark-mode-toggle-floating shadow-lg overflow-hidden group"
      aria-label="Toggle dark mode"
      style={{
        backgroundColor: darkMode ? '#1F2937' : '#ffffff',
        border: darkMode ? '2px solid #4B5563' : '2px solid #E5E7EB'
      }}
    >
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${darkMode ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'radial-gradient(circle at center, #1a202c 0%, transparent 70%)',
          }}
        ></div>
      </div>
      
      {/* Sun/Moon Container */}
      <div className="relative z-10 transform transition-transform duration-1000">
        {darkMode ? (
          // Moon with stars
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-full">
              {/* Stars */}
              <div className="absolute h-1 w-1 bg-yellow-200 rounded-full animate-twinkle" style={{ top: '-8px', left: '2px', animationDelay: '0s' }}></div>
              <div className="absolute h-1 w-1 bg-yellow-200 rounded-full animate-twinkle" style={{ top: '2px', right: '-6px', animationDelay: '0.3s' }}></div>
              <div className="absolute h-1 w-1 bg-yellow-200 rounded-full animate-twinkle" style={{ bottom: '-5px', right: '2px', animationDelay: '0.6s' }}></div>
              <div className="absolute h-0.5 w-0.5 bg-yellow-200 rounded-full animate-twinkle" style={{ bottom: '2px', left: '-4px', animationDelay: '0.9s' }}></div>
            </div>
            <svg className="w-7 h-7 text-yellow-300 transform transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
            </svg>
          </div>
        ) : (
          // Sun with rays
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-full animate-spin-slow">
              {/* Sun rays */}
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute h-1.5 w-1.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 sun-rays"
                  style={{ 
                    transform: `rotate(${i * 45}deg) translateX(12px)`,
                    transformOrigin: 'center center',
                    transitionDelay: `${i * 50}ms`
                  }}
                ></div>
              ))}
            </div>
            <svg className="w-8 h-8 text-yellow-500 transform transition-transform duration-500 group-hover:rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
            </svg>
          </div>
        )}
      </div>
    </button>
  );
};

export default DarkModeToggle;