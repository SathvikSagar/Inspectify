import React from 'react';

const SimpleLoader = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 z-50">
      <div className="mb-5">
        <div className="w-20 h-20 flex items-center justify-center shadow-md">
          <img src="/logo.png" alt="Inspectify Logo" className="w-full h-full object-contain" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-green-800">Inspectify</h1>
      <p className="text-gray-500 mt-2 mb-6">Road inspection made simple</p>
      <div className="w-48 h-1 bg-gray-200 rounded overflow-hidden">
        <div className="h-full bg-blue-800 animate-loading-bar"></div>
      </div>
    </div>
  );
};

export default SimpleLoader;