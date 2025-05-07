import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from "socket.io-client";
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

// Setup the WebSocket connection
const socket = io("http://localhost:5000");

const HomePage = () => (
  <>
    <Hero />
    <Features />
    <Testimonials />
    <Footer />
  </>
);

const App = () => {
  useEffect(() => {
    // WebSocket connection to listen for notifications
    socket.on("admin-notification", (data) => {
      toast.info(`New image uploaded: ${data.imagePath}`, {
        icon: "🚧",
      });
    });

    return () => {
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
      </Routes>

      {/* ToastContainer for displaying notifications */}
      <ToastContainer position="bottom-right" autoClose={5000} />
    </Router>
  );
};

export default App;
