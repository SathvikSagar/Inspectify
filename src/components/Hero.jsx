import React from 'react';
import { useNavigate } from 'react-router-dom';
import StyledButton from "./StyledButton"; 

const Hero = () => {
  const navigate = useNavigate();

  const handleDemoClick = () => {
    navigate('/demo');
  };

  return (
    <section
      className="py-20 px-6 md:px-12 lg:px-24 flex flex-col md:flex-row items-center justify-between bg-white"
      style={{ fontFamily: "'Rethink Sans', sans-serif" }}
    >
      {/* Left Side - Text */}
      <div className="w-full md:w-1/2 space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-green-900">
          <br />
        
          Smarter Roads Start with Smarter Inspections.
        </h1>
        <p className="text-lg text-gray-600">
          AI-driven damage detection and prioritization system to simplify road inspections and boost infrastructure safety.
        </p>
       
      <StyledButton onClick={handleDemoClick}>
        Start a demo
      </StyledButton>
      </div>

      {/* Right Side - Video (hidden on mobile) */}
      <div className="hidden md:flex pt-5 pl-45 md:w-1/2 mt-10 md:mt-0 justify-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full max-w-[400px] max-h-[580px] rounded-lg shadow-xl object-cover"
        >
          <source src="/heroo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
};



export default Hero;
