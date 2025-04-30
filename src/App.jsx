import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage';
import AboutUs from './pages/AboutUs';
import Upload from './components/Upload'; // Correct path

import User from './pages/user'; // Import User page
// import Contact from './pages/Contact';
import 'leaflet/dist/leaflet.css';


const HomePage = () => (
  <>
    <Hero />
    <Features />
    <Testimonials />
    <Footer />
    
  </>
);

const App = () => {
  return (
    
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutUs />} />
        {/* <Route path="/road-history" element={<RoadHistory />} /> */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/user" element={<User />} /> {/* ✅ Add User route */}
        <Route path="/contact" element={<Upload/>} />
       
      </Routes>
    </Router>
  );
};

export default App;
 