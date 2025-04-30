import React from "react";

export const HowItWorks = () => {
    return (
      <section className="py-16 px-6 md:px-12 lg:px-24 bg-gray-50 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-green-800 mb-2">1. Upload</h3>
            <p className="text-gray-600">Capture and upload images or videos of roads.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-green-800 mb-2">2. Analyze</h3>
            <p className="text-gray-600">Inspectify uses AI to detect damages and categorize them.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-green-800 mb-2">3. Classify</h3>
            <p className="text-gray-600">Each damage is classified based on type and severity.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-green-800 mb-2">4. Prioritize</h3>
            <p className="text-gray-600">Get a detailed report with repair priority levels.</p>
          </div>
        </div>
      </section>
    );
  };

  export default HowItWorks;