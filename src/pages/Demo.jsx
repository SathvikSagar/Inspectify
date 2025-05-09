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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Add custom animation styles */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* Enhanced Loading screen */}
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-blue-900 z-50 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-28 h-28 border-t-4 border-b-4 border-blue-400 rounded-full animate-spin"></div>
            <div className="w-20 h-20 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            <div className="w-12 h-12 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '0.5s' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-8 mb-2">Loading Demo...</h2>
          <p className="text-blue-200 text-center max-w-md">Preparing your interactive road damage detection experience</p>
          
          <div className="mt-8 flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
      
      {/* Enhanced Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        {/* Main blobs */}
        <div className="absolute top-0 right-0 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full w-[40rem] h-[40rem] -mt-24 -mr-24 filter blur-3xl animate-pulse opacity-20"></div>
        <div className="absolute bottom-0 left-0 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full w-[40rem] h-[40rem] -mb-24 -ml-24 filter blur-3xl animate-pulse opacity-20" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full w-[40rem] h-[40rem] filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Additional decorative elements */}
        <div className="absolute top-1/4 right-1/4 bg-gradient-to-br from-teal-300 to-cyan-400 rounded-full w-[30rem] h-[30rem] filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full w-[25rem] h-[25rem] filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '5s' }}></div>
        
        {/* Small floating particles */}
        <div className="absolute top-1/3 left-1/4 bg-white w-8 h-8 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-2/3 right-1/4 bg-white w-6 h-6 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s', animationDuration: '8s' }}></div>
        <div className="absolute top-1/2 left-1/3 bg-white w-4 h-4 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 bg-white w-5 h-5 rounded-full opacity-20 animate-float" style={{ animationDelay: '3s', animationDuration: '7s' }}></div>
      </div>

      {/* Enhanced Main content container */}
      <div 
        ref={containerRef} 
        className="max-w-6xl mx-auto relative z-10 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/30 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]"
        style={{
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 0 80px 0 rgba(0, 0, 0, 0.05) inset'
        }}
      >
        {/* Enhanced Progress bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full mb-8 overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${(currentSlide / 8) * 100}%` }}
          >
            <div className="absolute inset-0 bg-white/20 overflow-hidden rounded-full">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Welcome Text Only for First Slide */}
        {currentSlide === 1 && (
          <div className={`relative transition-all duration-1000 mb-8 ${isVisible.welcomeText ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'}`}>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-center mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to the Road Damage Detection Demo!
            </h1>
            <p className="text-center text-gray-600 max-w-3xl mx-auto text-lg">
              Explore our interactive guide to learn how our platform helps identify and report road damage efficiently.
            </p>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          </div>
        )}

        {/* Enhanced Step Text */}
        <div className="relative mb-12">
          <div className="absolute -left-5 top-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
            <span className="text-xl">{currentSlide}</span>
          </div>
          <div className={`relative transition-all duration-1000 ${isVisible.stepText ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl transform rotate-1"></div>
            <div className="px-8 py-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50 shadow-lg relative z-10">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
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
              className="absolute -left-5 sm:left-0 z-20 flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-110 border border-gray-100 group"
              aria-label="Previous slide"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700 group-hover:text-blue-600 transition-colors">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Enhanced Images and Arrow */}
          <div className="relative w-full flex justify-center items-center px-10">
            {currentSlide === 4 || currentSlide === 5 || currentSlide === 7 || currentSlide === 8 ? (
              <div className={`transition-all duration-1000 transform ${isVisible.firstImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative">
                    <img
                      src={slideContent[currentSlide - 1].img1}
                      alt={`${slideContent[currentSlide - 1].step} demonstration`}
                      className="w-auto max-w-full h-auto max-h-[400px] object-contain rounded-xl shadow-2xl border-4 border-white bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center">
                <div className={`transition-all duration-1000 transform ${isVisible.firstImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative">
                      <img
                        src={slideContent[currentSlide - 1].img1}
                        alt={`${slideContent[currentSlide - 1].step} before`}
                        className="w-auto max-w-full h-auto max-h-[350px] object-contain rounded-xl shadow-2xl border-4 border-white bg-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div className={`transition-all duration-1000 ${isVisible.arrow ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse opacity-70"></div>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 text-white">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                {slideContent[currentSlide - 1].img2 && (
                  <div className={`transition-all duration-1000 transform ${isVisible.secondImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative">
                        <img
                          src={slideContent[currentSlide - 1].img2}
                          alt={`${slideContent[currentSlide - 1].step} after`}
                          className="w-auto max-w-full h-auto max-h-[350px] object-contain rounded-xl shadow-2xl border-4 border-white bg-white"
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
              className="absolute -right-5 sm:right-0 z-20 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-110 group"
              aria-label="Next slide"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-white text-indigo-600 flex items-center justify-center text-xs font-bold border-2 border-indigo-500 shadow-md">
                {currentSlide + 1}
              </span>
            </button>
          )}
        </div>

        {/* Enhanced Dot Navigation with labels */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((dotIndex) => (
            <button
              key={dotIndex}
              onClick={() => handleDotClick(dotIndex)}
              className={`group relative flex flex-col items-center`}
              aria-label={`Go to slide ${dotIndex}`}
            >
              <span className={`w-10 h-3 rounded-full transition-all duration-500 ${
                activeDot === dotIndex 
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 w-14 shadow-lg shadow-indigo-500/30' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}></span>
              <span className={`absolute -bottom-7 text-sm font-medium transition-all duration-300 ${
                activeDot === dotIndex
                  ? 'text-indigo-700 opacity-100 transform scale-110'
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

        {/* Enhanced Mobile swipe indicator */}
        <div className="mt-10 hidden sm:block">
          <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-full px-6 py-3 shadow-inner max-w-md mx-auto border border-indigo-100/50">
            <div className="text-indigo-500 animate-pulse-slow">
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

        {/* Enhanced Step counter */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full text-base font-medium text-gray-800 border border-indigo-200/50 shadow-lg shadow-indigo-500/5">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white font-bold mr-3 shadow-md">
              {currentSlide}
            </div>
            <span>of</span>
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-gray-700 font-bold ml-3">
              8
            </div>
          </div>
        </div>
        
        {/* Added keyboard shortcuts help */}
        <div className="mt-6 text-center">
          <div className="inline-flex gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md shadow-sm mr-1">←</kbd>
              Previous
            </span>
            <span className="inline-flex items-center">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-md shadow-sm mr-1">→</kbd>
              Next
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;

