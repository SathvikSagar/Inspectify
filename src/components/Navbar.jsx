import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="w-full px-6 md:px-12 py-4 flex items-center justify-between bg-gray-100 text-black shadow-md fixed top-0 z-50">
      
      {/* Logo + Brand Name */}
      <div className="flex items-center space-x-3">
        <img src="/logo.png" alt="Inspectify Logo" className="h-10 w-10 rounded-full" />
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
      <div className="hidden md:flex">
        <Link to="/signup">
          <button className="bg-blue-800 text-white hover:bg-gray-800 rounded-full px-5 py-2 text-sm font-medium transition duration-300">
            Get Started
          </button>
        </Link>
      </div>

      {/* Mobile Menu Icon */}
      <div className="md:hidden">
        <button className="text-black focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
               viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
 