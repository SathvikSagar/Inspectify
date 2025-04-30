import React from "react";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";

const Features = () => {
  return (
    <div className="py-20 px-8 text-center">
      <h2 className="text-5xl font-bold text-green-900 mb-14 drop-shadow-lg  tracking-wide">
        Key Features
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <FeatureCard
          title="Damage Detection"
          description="Automatically identify cracks, potholes, and surface issues using Vision Transformers."
        />
        <FeatureCard
          title="Severity Classification"
          description="Assess severity levels to prioritize repair urgency using intelligent analysis."
        />
        <FeatureCard
          title="Smart Reports"
          description="Generate accurate visual summaries and repair recommendations in real-time."
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description }) => {
  return (
    <motion.div 
      className="relative bg-white shadow-lg rounded-2xl p-6 border border-gray-300 transition-transform transform hover:-translate-y-3 hover:shadow-xl flex flex-col items-center text-center overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-500 rounded-t-2xl"></div>
      <FaCheckCircle className="text-blue-500 text-4xl mb-4" />
      <h3 className="text-xl font-semibold text-blue-700 mb-3">{title}</h3>
      <p className="text-gray-600 text-base leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default Features;
