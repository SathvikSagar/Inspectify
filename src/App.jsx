import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from "socket.io-client";
import Demo from "./pages/Demo"; 
import  Admin from "./pages/Admin";
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ViewFeed from './pages/ViewFeed';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import AboutUs from './pages/AboutUs';
import AuthorityPage from './pages/AuthorityPage'; 
import Upload from './pages/Upload';
import User from './pages/user';
import Contact from './pages/Contact';
import Report from './pages/Report';
import MapView from './pages/MapView';
import 'leaflet/dist/leaflet.css';

// Import API configuration and helpers
import { BACKEND_URL, getSocketUrl } from './utils/apiConfig';
import { fixLocalStorageUrls } from './utils/apiHelper';

// Initialize socket connection
let socket;

try {
  // Try to connect to the real socket server
  const socketUrl = getSocketUrl();
  console.log("Connecting to socket.io server at:", socketUrl);
  socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000
  });
} catch (error) {
  console.error("Error connecting to socket server:", error);
  // Fallback to a mock socket
  socket = {
    on: () => {},
    off: () => {},
    emit: () => {},
    connect: () => {},
    disconnect: () => {}
  };
}

const HomePage = () => (
  <>
    <Hero />
    <Features />
    <Testimonials />
    <Footer />
  </>
);

const App = () => {
  const [socketConnected, setSocketConnected] = useState(false);
  
  useEffect(() => {
    // Fix any localStorage URLs that might be using localhost
    try {
      fixLocalStorageUrls();
    } catch (error) {
      console.error("Error fixing localStorage URLs:", error);
    }
    
    // Set up socket connection events
    socket.on("connect", () => {
      console.log("Socket connected successfully");
      setSocketConnected(true);
      
      // Get userId from localStorage if available
      const userId = localStorage.getItem('userId');
      if (userId) {
        console.log("Authenticating socket with userId:", userId);
        socket.emit("authenticate", userId);
      }
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setSocketConnected(false);
    });
    
    // WebSocket connection to listen for notifications
    socket.on("admin-notification", (data) => {
      toast.info(`New image uploaded: ${data.imagePath}`, {
        icon: "🚧",
      });
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("admin-notification");
    };
  }, []);
  
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/user" element={<User />} /> {/* Add User route */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/authority" element={<AuthorityPage />} />
        <Route path="/report" element={<Report />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/view" element={<ViewFeed />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>

      {/* ToastContainer for displaying notifications */}
      <ToastContainer 
        position="bottom-right" 
        autoClose={5000}
        theme="colored" 
      />
    </Router>
  );
};

export default App;
