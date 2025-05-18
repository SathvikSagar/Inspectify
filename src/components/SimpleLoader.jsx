import React from 'react';

const SimpleLoader = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 z-50">
      <div className="mb-5">
        <img src="/logo.png" alt="Inspectify Logo" className="w-20 h-20 object-contain" />
      </div>
      <h1 className="text-gray-900 mt-2 mb-6 font-bold text-xl">Inspectify</h1>
      <p className="text-gray-800 mt-2 mb-6 font-medium">Road inspection made simple</p>
      <div className="w-48 h-1 bg-gray-200 rounded overflow-hidden">
        <div className="h-full bg-blue-800 animate-loading-bar"></div>
      </div>
    </div>
  );
};

export default SimpleLoader;