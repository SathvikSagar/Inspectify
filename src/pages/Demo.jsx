import React, { useState, useEffect, useRef } from 'react';

// Custom animation styles
const customStyles = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 2s ease-in-out infinite;
  }
`;

const Demo = () => {
  // Refs for animation elements
  const containerRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState({
    welcomeText: false,
    descriptionText: false,
    stepText: false,
    firstImage: false,
    arrow: false,
    secondImage: false,
    nextButton: false,
    prevButton: false,
  });

  const [currentSlide, setCurrentSlide] = useState(1);
  const [activeDot, setActiveDot] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Initial loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleNextClick = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const nextSlide = Math.min(currentSlide + 1, 8);
    setCurrentSlide(nextSlide);
    setActiveDot(nextSlide);
    
    // Add a subtle scroll effect
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Reset transitioning state after animations complete
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  const handlePreviousClick = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const prevSlide = Math.max(currentSlide - 1, 1);
    setCurrentSlide(prevSlide);
    setActiveDot(prevSlide);
    
    // Add a subtle scroll effect
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Reset transitioning state after animations complete
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  const handleDotClick = (dotIndex) => {
    if (isTransitioning || dotIndex === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(dotIndex);
    setActiveDot(dotIndex);
    
    // Add a subtle scroll effect
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Reset transitioning state after animations complete
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  // Handle keyboard navigation and touch swipe
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        if (currentSlide < 8) handleNextClick();
      } else if (e.key === 'ArrowLeft') {
        if (currentSlide > 1) handlePreviousClick();
      }
    };

    // Touch swipe handling
    let touchStartX = 0;
    let touchEndX = 0;
    
    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };
    
    const handleSwipe = () => {
      // Minimum swipe distance (in px) to trigger navigation
      const minSwipeDistance = 50;
      
      if (touchEndX < touchStartX - minSwipeDistance) {
        // Swiped left, go to next slide
        if (currentSlide < 8) handleNextClick();
      } 
      
      if (touchEndX > touchStartX + minSwipeDistance) {
        // Swiped right, go to previous slide
        if (currentSlide > 1) handlePreviousClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentSlide]);

  useEffect(() => {
    setIsVisible({
      welcomeText: false,
      descriptionText: false,
      stepText: false,
      firstImage: false,
      arrow: false,
      secondImage: false,
      nextButton: false,
      prevButton: false,
    });

    setTimeout(() => setIsVisible((prev) => ({ ...prev, welcomeText: currentSlide === 1 })), 100);
    setTimeout(() => setIsVisible((prev) => ({ ...prev, descriptionText: true })), 600);
    setTimeout(() => setIsVisible((prev) => ({ ...prev, stepText: true })), 1000);
    setTimeout(() => setIsVisible((prev) => ({ ...prev, firstImage: true })), 1400);
    setTimeout(() => setIsVisible((prev) => ({ ...prev, arrow: true })), 1800);
    setTimeout(() => setIsVisible((prev) => ({ ...prev, secondImage: true })), 2200);
    setTimeout(() => setIsVisible((prev) => ({ ...prev, nextButton: true, prevButton: currentSlide !== 1 })), 2600);
  }, [currentSlide]);

  const slideContent = [
    {
      step: "Step 1",
      text: "Click the 'Get Started' button on the homepage to create your account and begin using the platform.",
      img1: "1-1.jpg",
      img2: "gtst.jpg"
    },
    {
      step: "Step 2",
      text: "Click 'Login' on the homepage and enter your credentials to access your account.",
      img1: "lgna.png",
      img2: "lgn.jpg"
    },
    {
      step: "Step 3",
      text: "After you log in, you go to the 'Dashboard' and click the 'Camera' icon to upload an image of the road damage.",
      img1: "dshbrda.png",
      img2: "cmrad.png"
    },
    {
      step: "Step 4",
      text: "Click on a 'Analyze Road Condition' to determine whether the uploaded image contains a road or not.",
      img1: "anlz.png",
      img2: "report.png"
    },
    {
      step: "Step 5",
      text: "Click 'History' to view the previously reported road issues and track their progress over time.",
      img1: "hstry.jpg",
      img2: "status2.png"
    },
    {
      step: "Step 6",
      text: "Get notified once your issue is resolved by authorities.",
      img1: "dshbrdn.png",
      img2: "ntfcn1.jpg"
    },
    {
      step: "Step 7",
      text: "Get the progress of your report through notifications, which updates in real-time.",
      img1: "stsbr.jpg",
      img2: "" // Leave empty since this is a single image
    },
    {
      step: "Step 8",
      text: "Need help or want to share feedback? Click on Contact Us to reach our support team for assistance or queries.",
      img1: "cnt.jpg",
      img2: "" // Leave empty since this is a single image
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Add custom animation styles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* Modern geometric shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/10 rounded-full -mt-32 -mr-32 backdrop-blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full -mb-48 -ml-48 backdrop-blur-3xl"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-emerald-400/10 rounded-lg rotate-12 backdrop-blur-xl"></div>
      <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-green-400/10 rounded-lg -rotate-12 backdrop-blur-xl"></div>
      {/* Modern Loading screen with animated elements */}
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-900 to-emerald-900 z-50 flex flex-col items-center justify-center overflow-hidden">
          {/* Background animated shapes */}
          <div className="absolute w-full h-full overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/10 rounded-full mix-blend-overlay animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full mix-blend-overlay animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-3/4 left-1/3 w-48 h-48 bg-emerald-500/10 rounded-full mix-blend-overlay animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          
          {/* Modern spinner */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 p-1 animate-spin">
              <div className="w-full h-full bg-green-900 rounded-full"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-r from-teal-400 via-green-500 to-emerald-500 p-1 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
              <div className="w-full h-full bg-green-900 rounded-full"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mt-10 mb-2 tracking-tight">Loading Demo</h2>
          <div className="h-1 w-48 bg-green-900 rounded-full overflow-hidden mt-1 mb-4">
            <div className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 animate-shimmer"></div>
          </div>
          <p className="text-green-200 text-center max-w-md font-light">Preparing your interactive road damage detection experience</p>
        </div>
      )}
      
      {/* Enhanced Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        {/* Main blobs */}
        <div className="absolute top-0 right-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full w-[40rem] h-[40rem] -mt-24 -mr-24 filter blur-3xl animate-pulse opacity-20"></div>
        <div className="absolute bottom-0 left-0 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-full w-[40rem] h-[40rem] -mb-24 -ml-24 filter blur-3xl animate-pulse opacity-20" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-teal-400 to-green-500 rounded-full w-[40rem] h-[40rem] filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Additional decorative elements */}
        <div className="absolute top-1/4 right-1/4 bg-gradient-to-br from-green-300 to-teal-400 rounded-full w-[30rem] h-[30rem] filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 bg-gradient-to-br from-emerald-300 to-green-400 rounded-full w-[25rem] h-[25rem] filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '5s' }}></div>
        
        {/* Small floating particles */}
        <div className="absolute top-1/3 left-1/4 bg-white w-8 h-8 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-2/3 right-1/4 bg-white w-6 h-6 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s', animationDuration: '8s' }}></div>
        <div className="absolute top-1/2 left-1/3 bg-white w-4 h-4 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 bg-white w-5 h-5 rounded-full opacity-20 animate-float" style={{ animationDelay: '3s', animationDuration: '7s' }}></div>
      </div>

      {/* Enhanced Main content container with glass morphism */}
      <div 
        ref={containerRef} 
        className="max-w-6xl mx-auto relative z-10 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 sm:p-10 border border-white/40 transition-all duration-500 hover:shadow-[0_25px_80px_-15px_rgba(0,128,0,0.25)] overflow-hidden"
        style={{
          boxShadow: '0 15px 50px -12px rgba(0, 128, 0, 0.15), 0 0 100px 0 rgba(255, 255, 255, 0.2) inset'
        }}
      >
        {/* Modern decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-green-300/20 to-teal-300/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-emerald-300/20 to-green-300/20 rounded-full blur-2xl"></div>
        {/* Modern Progress bar with animated indicator */}
        <div className="w-full h-2 bg-gray-100/50 rounded-full mb-10 overflow-hidden shadow-inner backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out relative"
            style={{ width: `${(currentSlide / 8) * 100}%` }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-green-500/30 border-2 border-teal-500"></div>
          </div>
        </div>

        {/* Modern Welcome Text with enhanced typography */}
        {currentSlide === 1 && (
          <div className={`relative transition-all duration-1000 mb-12 ${isVisible.welcomeText ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'}`}>
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-green-400/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-teal-400/10 rounded-full blur-xl"></div>
            
            <h1 className="text-5xl sm:text-6xl font-black text-center mb-6 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent tracking-tight leading-tight">
              Welcome to the Road Damage Detection Demo
            </h1>
            
            <p className="text-center text-gray-600 max-w-3xl mx-auto text-lg font-light leading-relaxed">
              Explore our interactive guide to learn how our platform helps identify and report road damage efficiently.
            </p>
            
            <div className="flex justify-center mt-8">
              <div className="h-1 w-32 bg-gradient-to-r from-green-400 to-teal-500 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Modern Step Text with enhanced styling */}
        <div className="relative mb-14">
          <div className="absolute -left-6 top-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-xl transform rotate-6 hover:rotate-0 transition-transform duration-300 backdrop-blur-sm">
            <span className="text-2xl">{currentSlide}</span>
          </div>
          <div className={`relative transition-all duration-1000 ${isVisible.stepText ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-teal-500/5 rounded-[1.5rem] transform rotate-1"></div>
            <div className="px-10 py-8 rounded-[1.5rem] bg-gradient-to-r from-green-50/80 to-teal-50/80 border border-green-100/60 shadow-xl relative z-10 backdrop-blur-sm">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                {slideContent[currentSlide - 1].step}
              </div>
              <h2 className="text-2xl font-bold text-indigo-800 mb-3">{slideContent[currentSlide - 1].step}</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{slideContent[currentSlide - 1].text}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Slide Image Section */}
        <div className="relative flex items-center justify-center gap-8 mb-10 min-h-[400px]">
          {/* Enhanced Previous Button */}
          {isVisible.prevButton && currentSlide > 1 && (
            <button
              onClick={handlePreviousClick}
              className="absolute -left-7 sm:left-0 z-20 flex items-center justify-center w-16 h-16 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 border border-green-100/50 group"
              aria-label="Previous slide"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700 group-hover:text-green-600 transition-colors">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Enhanced Images and Arrow */}
          <div className="relative w-full flex justify-center items-center px-10">
            {currentSlide === 4 || currentSlide === 5 || currentSlide === 7 || currentSlide === 8 ? (
              <div className={`transition-all duration-1000 transform ${isVisible.firstImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-3xl blur-md opacity-25 group-hover:opacity-60 transition duration-500 group-hover:duration-200"></div>
                  <div className="relative p-1 bg-gradient-to-r from-green-400/50 to-teal-500/50 rounded-2xl backdrop-blur-sm">
                    <img
                      src={slideContent[currentSlide - 1].img1}
                      alt={`${slideContent[currentSlide - 1].step} demonstration`}
                      className="w-auto max-w-full h-auto max-h-[400px] object-contain rounded-xl shadow-xl border-2 border-white/80 bg-white/90"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center">
                <div className={`transition-all duration-1000 transform ${isVisible.firstImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl blur-md opacity-25 group-hover:opacity-60 transition duration-500 group-hover:duration-200"></div>
                    <div className="relative p-1 bg-gradient-to-r from-green-400/50 to-emerald-500/50 rounded-2xl backdrop-blur-sm">
                      <img
                        src={slideContent[currentSlide - 1].img1}
                        alt={`${slideContent[currentSlide - 1].step} before`}
                        className="w-auto max-w-full h-auto max-h-[350px] object-contain rounded-xl shadow-xl border-2 border-white/80 bg-white/90"
                      />
                    </div>
                  </div>
                </div>
                
                <div className={`transition-all duration-1000 ${isVisible.arrow ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl rotate-45 animate-pulse opacity-70 backdrop-blur-sm"></div>
                    <div className="absolute inset-2 bg-white/30 rounded-xl rotate-45 backdrop-blur-md"></div>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 text-white drop-shadow-lg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                {slideContent[currentSlide - 1].img2 && (
                  <div className={`transition-all duration-1000 transform ${isVisible.secondImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <div className="relative group">
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur-md opacity-25 group-hover:opacity-60 transition duration-500 group-hover:duration-200"></div>
                      <div className="relative p-1 bg-gradient-to-r from-emerald-400/50 to-teal-500/50 rounded-2xl backdrop-blur-sm">
                        <img
                          src={slideContent[currentSlide - 1].img2}
                          alt={`${slideContent[currentSlide - 1].step} after`}
                          className="w-auto max-w-full h-auto max-h-[350px] object-contain rounded-xl shadow-xl border-2 border-white/80 bg-white/90"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Next Button */}
          {isVisible.nextButton && currentSlide < 8 && (
            <button
              onClick={handleNextClick}
              className="absolute -right-7 sm:right-0 z-20 flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 group"
              aria-label="Next slide"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="absolute -right-3 -top-3 w-8 h-8 rounded-xl bg-white text-green-600 flex items-center justify-center text-sm font-bold border-2 border-green-500 shadow-lg">
                {currentSlide + 1}
              </span>
            </button>
          )}
        </div>

        {/* Modern Dot Navigation with enhanced styling */}
        <div className="flex flex-wrap justify-center gap-5 mt-14 relative">
          <div className="absolute inset-x-0 -top-6 bottom-6 bg-gray-50/50 rounded-2xl -z-10 backdrop-blur-sm"></div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((dotIndex) => (
            <button
              key={dotIndex}
              onClick={() => handleDotClick(dotIndex)}
              className={`group relative flex flex-col items-center`}
              aria-label={`Go to slide ${dotIndex}`}
            >
              <span className={`transition-all duration-500 ${
                activeDot === dotIndex 
                  ? 'w-16 h-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-green-500/30' 
                  : 'w-10 h-3 bg-gray-200 hover:bg-gray-300 rounded-full hover:scale-110'
              }`}></span>
              <span className={`absolute -bottom-8 text-sm font-medium transition-all duration-300 ${
                activeDot === dotIndex
                  ? 'text-green-700 opacity-100 font-bold transform scale-110'
                  : 'text-gray-500 opacity-0 group-hover:opacity-100'
              }`}>
                {dotIndex}
              </span>
              {activeDot === dotIndex && (
                <span className="absolute -top-7 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  {slideContent[dotIndex - 1].step}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modern Mobile swipe indicator */}
        <div className="mt-12 hidden sm:block">
          <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl px-8 py-4 shadow-lg max-w-md mx-auto border border-green-100/50 backdrop-blur-sm">
            <div className="text-green-500 animate-pulse-slow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-sm font-medium text-gray-700">Swipe or use keyboard arrows to navigate</div>
            <div className="text-indigo-500 animate-pulse-slow" style={{ animationDelay: '0.5s' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Modern Step counter with enhanced styling */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-2xl text-base font-medium text-gray-800 border border-green-200/50 shadow-xl shadow-green-500/10 backdrop-blur-sm">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white font-bold mr-4 shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
              {currentSlide}
            </div>
            <span className="mx-2 text-green-700/70">of</span>
            <div className="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl text-green-700 font-bold ml-4 border-2 border-green-200/50 shadow-md">
              8
            </div>
          </div>
        </div>
        
        {/* Modern keyboard shortcuts help */}
        <div className="mt-8 text-center">
          <div className="inline-flex gap-5 text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-xl shadow-md">
            <span className="inline-flex items-center">
              <kbd className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg shadow-sm mr-2 font-mono">←</kbd>
              Previous
            </span>
            <span className="inline-flex items-center">
              <kbd className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg shadow-sm mr-2 font-mono">→</kbd>
              Next
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;

