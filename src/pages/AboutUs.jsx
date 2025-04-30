import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function AboutUs() {
  return (
    <div className="pt-20 flex flex-col min-h-screen bg-[#f9fafb] relative overflow-hidden">
      {/* Background Gradient Glow */}
      <div className="absolute w-[700px] h-[700px] bg-purple-300 opacity-30 blur-[160px] top-[-100px] right-[-150px] -z-10"></div>

      {/* Hero Section */}
      <section className="flex-grow px-6 md:px-20 py-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left Text */}
          <div>
            <h1 className="text-5xl font-extrabold leading-tight text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Empowering Smart Cities
              </span> with AI Vision
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              At <strong>Inspectify</strong>, we revolutionize infrastructure monitoring using AI and computer vision. Our platform enables cities and organizations to detect, classify, and act on road damage — faster and smarter.
            </p>
            <Link to="/signup">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all duration-300 hover:scale-105">
                Start Free
              </button>
            </Link>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="w-full h-[400px] rounded-3xl overflow-hidden shadow-xl">
              <img src="/load.jpg" alt="AI in Action" className="object-cover w-full h-full" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-purple-100 rounded-full blur-xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="px-6 md:px-20 py-24 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="w-full h-[380px] rounded-3xl overflow-hidden shadow-md p-4 bg-white border border-gray-200">
              <img src="/dir.svg" alt="Mission Vision" className="w-full h-full object-contain" />
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-200 rounded-full blur-xl -z-10"></div>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 text-lg mb-4">
              We're driven by a vision to make inspections effortless and intelligent. By utilizing <strong>Vision Transformers (ViT)</strong>, we bring AI precision to real-world challenges.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li>✅ Detect road damage with pixel-perfect precision</li>
              <li>✅ Prioritize repairs based on severity</li>
              <li>✅ Empower smarter urban planning & safety</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Highlight Stats */}
      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10 text-center">
          {[
            { title: "98%", subtitle: "Detection Accuracy" },
            { title: "10x", subtitle: "Faster Than Manual" },
            { title: "24/7", subtitle: "Automated Monitoring" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition">
              <h3 className="text-4xl font-bold text-indigo-700">{stat.title}</h3>
              <p className="text-gray-600 mt-2">{stat.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
