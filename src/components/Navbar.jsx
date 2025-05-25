import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuOpen && 
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);
  
  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      // Prevent scrolling on body when menu is open
      document.body.style.overflow = 'hidden';
      
      // Add keyboard event listener for Escape key
      const handleEscKey = (event) => {
        if (event.key === 'Escape') {
          setMobileMenuOpen(false);
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      
      // Cleanup function
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    } else {
      // Re-enable scrolling when menu is closed
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function to ensure scroll is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  return (
    <header className={`w-full px-6 md:px-12 py-4 flex flex-col bg-gray-100 text-black shadow-md fixed top-0 z-50 transition-all duration-300 ${mobileMenuOpen ? 'pb-2' : ''}`}>
      <div className="flex items-center justify-between w-full">
        {/* Logo + Brand Name */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 overflow-hidden flex items-center justify-center">
            <img src="/lago.png" alt="Inspectify Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-green-800 text-2xl font-bold tracking-wide">
            Inspectify
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex space-x-8 text-sm font-medium">
          <Link to="/" className="text-green-800 text-lg hover:text-gray-600 hover:underline transition-colors duration-200">Home</Link>
          <Link to="/about" className="text-green-800 text-lg hover:text-gray-600 hover:underline transition-colors duration-200">About Us</Link>
          <Link to="/login" className="text-green-800 text-lg hover:text-gray-600 hover:underline transition-colors duration-200">Login</Link>
          <Link to="/demo" className="text-green-800 text-lg hover:text-gray-600 hover:underline transition-colors duration-200">Demo</Link>
          <Link to="/contact" className="text-green-800 text-lg hover:text-gray-600 hover:underline transition-colors duration-200">Contact Us</Link>
        </nav>

        {/* Desktop Button */}
        <div className="hidden md:flex items-center">
          <Link to="/signup">
            <button className="bg-blue-800 text-white hover:bg-green-800 rounded-full px-5 py-2 text-sm font-medium transition duration-300">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <button 
            ref={buttonRef}
            className="text-black focus:outline-none p-2 rounded-md hover:bg-gray-200 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu (Dropdown) */}
      {mobileMenuOpen && (
        <div ref={menuRef} className="md:hidden mt-4 pb-2 animate-fade-in-down mobile-menu-container bg-white border-gray-200 rounded-lg shadow-lg border">
          <nav className="flex flex-col divide-y divide-gray-100">
            <Link 
              to="/" 
              className="text-green-800 hover:bg-green-50 px-6 py-3 flex items-center transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <Link 
              to="/about" 
              className="text-green-800 hover:bg-green-50 px-6 py-3 flex items-center transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About Us
            </Link>
            <Link 
              to="/login" 
              className="text-green-800 hover:bg-green-50 px-6 py-3 flex items-center transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login
            </Link>
            <Link 
              to="/demo" 
              className="text-green-800 hover:bg-green-50 px-6 py-3 flex items-center transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Demo
            </Link>
            <Link 
              to="/contact" 
              className="text-green-800 hover:bg-green-50 px-6 py-3 flex items-center transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </Link>
            <div className="px-6 py-4 space-y-4">
              <Link 
                to="/signup" 
                className="bg-blue-800 text-white hover:bg-blue-900 px-4 py-3 rounded-md transition-colors duration-200 text-center block font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
 