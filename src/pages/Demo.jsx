import React, { useState, useEffect, useRef } from 'react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Loading screen */}
      {isLoading && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <div className="w-24 h-24 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">Loading Demo...</h2>
          <p className="text-gray-500 mt-2">Preparing your road damage detection experience</p>
        </div>
      )}
      
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
        <div className="absolute top-0 right-0 bg-blue-400 rounded-full w-96 h-96 -mt-24 -mr-24 filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 bg-green-400 rounded-full w-96 h-96 -mb-24 -ml-24 filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-400 rounded-full w-96 h-96 filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Additional decorative elements */}
        <div className="absolute top-1/4 right-1/4 bg-teal-300 rounded-full w-64 h-64 filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 bg-yellow-300 rounded-full w-48 h-48 filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '5s' }}></div>
      </div>

      {/* Main content container */}
      <div ref={containerRef} className="max-w-6xl mx-auto relative z-10 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 transition-all duration-500 hover:shadow-2xl">
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentSlide / 8) * 100}%` }}
          ></div>
        </div>

        {/* Render Welcome Text Only for First Slide */}
        {currentSlide === 1 && (
          <h1 className={`text-5xl font-bold text-center mb-6 bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent transition-all duration-1000 ${isVisible.welcomeText ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'}`}>
            Welcome to the Road Damage Detection Demo!
          </h1>
        )}

        {/* Step Text */}
        <div className="relative mb-12">
          <div className="absolute -left-4 top-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
            {currentSlide}
          </div>
          <p className={`text-2xl font-medium text-center px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm transition-all duration-1000 ${isVisible.stepText ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            <span className="block text-lg text-indigo-600 font-semibold mb-1">{slideContent[currentSlide - 1].step}</span>
            <span className="text-gray-800">{slideContent[currentSlide - 1].text}</span>
          </p>
        </div>

        {/* Slide Image Section */}
        <div className="relative flex items-center justify-center gap-8 mb-10 min-h-[400px]">
          {/* Previous Button */}
          {isVisible.prevButton && currentSlide > 1 && (
            <button
              onClick={handlePreviousClick}
              className="absolute left-0 z-20 flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 border border-gray-100 group"
              aria-label="Previous slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700 group-hover:text-blue-600 transition-colors">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Images and Arrow */}
          <div className="relative w-full flex justify-center items-center">
            {currentSlide === 4 || currentSlide === 5 || currentSlide === 7 || currentSlide === 8 ? (
              <div className={`transition-all duration-1000 transform ${isVisible.firstImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <img
                  src={slideContent[currentSlide - 1].img1}
                  alt={`${slideContent[currentSlide - 1].step} demonstration`}
                  className="w-auto max-w-full h-auto max-h-[400px] object-contain rounded-xl shadow-2xl border-4 border-white"
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center">
                <div className={`transition-all duration-1000 transform ${isVisible.firstImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <img
                    src={slideContent[currentSlide - 1].img1}
                    alt={`${slideContent[currentSlide - 1].step} before`}
                    className="w-auto max-w-full h-auto max-h-[350px] object-contain rounded-xl shadow-2xl border-4 border-white"
                  />
                </div>
                
                <div className={`transition-all duration-1000 ${isVisible.arrow ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 text-blue-600">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                {slideContent[currentSlide - 1].img2 && (
                  <div className={`transition-all duration-1000 transform ${isVisible.secondImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <img
                      src={slideContent[currentSlide - 1].img2}
                      alt={`${slideContent[currentSlide - 1].step} after`}
                      className="w-auto max-w-full h-auto max-h-[350px] object-contain rounded-xl shadow-2xl border-4 border-white"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Next Button */}
          {isVisible.nextButton && currentSlide < 8 && (
            <button
              onClick={handleNextClick}
              className="absolute right-0 z-20 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group"
              aria-label="Next slide"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-bold border-2 border-blue-500">
                {currentSlide + 1}
              </span>
            </button>
          )}
        </div>

        {/* Dot Navigation with labels */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((dotIndex) => (
            <button
              key={dotIndex}
              onClick={() => handleDotClick(dotIndex)}
              className={`group relative flex flex-col items-center`}
              aria-label={`Go to slide ${dotIndex}`}
            >
              <span className={`w-8 h-2 rounded-full transition-all duration-300 ${
                activeDot === dotIndex 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 w-12' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}></span>
              <span className="absolute -bottom-6 text-xs font-medium text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {dotIndex}
              </span>
            </button>
          ))}
        </div>

        {/* Mobile swipe indicator */}
        <div className="mt-8 hidden sm:block">
          <div className="flex items-center justify-center gap-4">
            <div className="text-gray-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-sm text-gray-500">Swipe or use keyboard arrows to navigate</div>
            <div className="text-gray-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Step counter */}
        <div className="mt-8 text-center">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full text-sm font-medium text-gray-700 border border-blue-100">
            Step <span className="text-blue-600 font-bold">{currentSlide}</span> of <span className="text-gray-500">8</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Demo;

