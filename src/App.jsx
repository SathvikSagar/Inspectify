// Import necessary React and routing libraries
import React, { useEffect } from "react";                          // Core React library with useEffect hook for side effects
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // React Router for navigation
import { ToastContainer, toast } from "react-toastify";            // Toast notifications library
import "react-toastify/dist/ReactToastify.css";                    // Styles for toast notifications
import { io } from "socket.io-client";                             // Socket.IO client for real-time communication

// Import all page components
import Demo from "./pages/Demo";                                   // Demo page for showcasing features
import Admin from "./pages/Admin";                                 // Admin dashboard for system management
import Navbar from './components/Navbar';                          // Navigation bar component
import Hero from './components/Hero';                              // Hero section for landing page
import ViewFeed from './pages/ViewFeed';                           // Feed view for damage reports
import Features from './components/Features';                      // Features showcase component
import Testimonials from './components/Testimonials';              // User testimonials component
import Footer from './components/Footer';                          // Footer component
import SignupPage from './pages/SignupPage';                       // User registration page
import LoginPage from './pages/LoginPage';                         // User login page
import AboutUs from './pages/AboutUs';                             // About us information page
import AuthorityPage from './pages/AuthorityPage';                 // Municipal authority dashboard
import Upload from './pages/Upload';                               // Image upload and analysis page
import User from './pages/user';                                   // User profile and dashboard
import Contact from './pages/Contact';                             // Contact form page
import Report from './pages/Report';                               // Damage reporting page
import MapView from './pages/MapView';                             // Map visualization of damage reports
import 'leaflet/dist/leaflet.css';                                 // CSS for Leaflet maps

// Setup the WebSocket connection to the backend server
const socket = io("http://localhost:5000");                        // Initialize Socket.IO connection

// HomePage component combines multiple components to create the landing page
const HomePage = () => (
  <>
    <Hero />                                                     
    <Features />  
    <Testimonials />                                                 
    <Footer />                                                     
  </>
);

// Main App component that sets up routing and global notifications
const App = () => {
  // Set up WebSocket listeners when component mounts
  useEffect(() => {
    // Listen for admin notifications about new uploads
    socket.on("admin-notification", (data) => {
      // Display toast notification when new image is uploaded
      toast.info(`New image uploaded: ${data.imagePath}`, {
        icon: "🚧",                                                // Road work icon for notifications
      });
    });

    // Clean up event listeners when component unmounts
    return () => {
      socket.off("admin-notification");                            // Remove event listener
    };
  }, []);                                                          // Empty dependency array means this runs once on mount
  
  return (
    <Router>                                                       // BrowserRouter for client-side routing
      <div className="bg-white text-gray-900">                     // Main container with styling
      <Navbar />                                                   // Global navigation bar
      <Routes>                                                     // Routes configuration
        <Route path="/" element={<HomePage />} />                  // Home page route
        <Route path="/login" element={<LoginPage />} />            // Login page route
        <Route path="/about" element={<AboutUs />} />              // About us page route
        <Route path="/signup" element={<SignupPage />} />          // Signup page route
        <Route path="/user" element={<User />} />                  // User dashboard route
        <Route path="/contact" element={<Contact />} />            // Contact page route
        <Route path="/upload" element={<Upload />} />              // Upload page route
        <Route path="/authority" element={<AuthorityPage />} />    // Authority dashboard route
        <Route path="/report" element={<Report />} />              // Report creation route
        <Route path="/admin" element={<Admin />} />                // Admin dashboard route
        <Route path="/view" element={<ViewFeed />} />              // View feed route
        <Route path="/map" element={<MapView />} />                // Map view route
        <Route path="/demo" element={<Demo />} />                  // Demo page route
      </Routes>

      {/* ToastContainer for displaying notifications */}
      <ToastContainer 
        position="bottom-right"                                    // Position notifications at bottom right
        autoClose={5000}                                           // Auto close after 5 seconds
        theme="colored"                                            // Use colored theme for better visibility
      />
      </div>
    </Router>
  );
};

export default App;                                                // Export the App component as default
