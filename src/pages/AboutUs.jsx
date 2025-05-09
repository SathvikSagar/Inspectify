import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import { CheckCircle, Users, Award, Zap, BarChart2, Shield } from "lucide-react";

export default function AboutUs() {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  // Team members removed as requested

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900 font-inter antialiased pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-between px-6 md:px-20 max-w-screen-xl mx-auto">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 z-0"></div>
        
        <motion.div 
          className="max-w-xl space-y-8 z-10"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block mb-2">
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent text-sm font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-green-200">
              About Our Company
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900">
            <span className="bg-gradient-to-br from-green-600 to-teal-600 bg-clip-text text-transparent">
              AI-Powered Inspections
            </span> for Modern Cities
          </h1>
          
          <p className="text-gray-600 text-xl leading-relaxed">
            Turn infrastructure issues into actionable insights — instantly, intelligently, and automatically. We're revolutionizing how cities maintain their roads.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/signup">
              <button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transition-all hover:-translate-y-1">
                Start now →
              </button>
            </Link>
            <Link to="/contact">
              <button className="bg-white border border-gray-300 text-gray-700 hover:text-green-700 hover:border-green-300 px-8 py-4 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-1">
                Contact Us
              </button>
            </Link>
          </div>
        </motion.div>
        
        <motion.div 
          className="relative hidden md:block w-[500px] h-[400px]"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <img src="/load.jpg" className="rounded-3xl shadow-2xl object-cover w-full h-full" alt="Road inspection" />
          <div className="absolute top-[-30px] left-[-30px] w-32 h-32 bg-green-200 blur-3xl rounded-full opacity-40"></div>
          <div className="absolute bottom-[-20px] right-[-20px] w-28 h-28 bg-teal-200 blur-2xl rounded-full opacity-60"></div>
        </motion.div>
      </section>

      {/* Vision & Mission Section */}
      <section className="px-6 md:px-20 py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-50 rounded-full -mr-48 -mt-48 opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-50 rounded-full -ml-48 -mb-48 opacity-70"></div>
        
        <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-full h-[380px] rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-200 p-6 relative z-10">
              <img src="/dir.svg" alt="Mission Vision" className="w-full h-full object-contain" />
            </div>
            <div className="absolute top-6 right-6 w-full h-full bg-gradient-to-br from-green-100 to-teal-100 rounded-3xl -z-10 transform rotate-3"></div>
          </motion.div>
          
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="inline-block mb-2">
              <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent text-sm font-semibold tracking-wider uppercase">
                Our Vision & Mission
              </span>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900">Transforming Urban Infrastructure</h2>
            
            <p className="text-gray-700 text-lg leading-relaxed">
              We're driven by a vision to make inspections effortless and intelligent. With <strong>Vision Transformers (ViT)</strong>, we deliver AI precision for real-world infrastructure challenges.
            </p>
            
            <div className="space-y-4">
              {[
                "Pixel-perfect damage detection with 98% accuracy",
                "Prioritized repairs using AI insights and predictive analytics",
                "Safer, smarter urban planning through data-driven decisions"
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="ml-3 text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <motion.section 
        className="py-24 bg-gradient-to-r from-green-50 to-teal-50 relative overflow-hidden"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute top-0 left-0 w-full h-20 bg-[url('/wave-pattern.svg')] bg-repeat-x opacity-10"></div>
        
        <div className="max-w-screen-xl mx-auto px-6 text-center mb-16">
          <motion.div variants={fadeIn}>
            <div className="inline-block mb-3">
              <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent text-sm font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-green-200">
                Our Impact
              </span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Driving Real Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform has transformed infrastructure management for cities worldwide.
            </p>
          </motion.div>
        </div>
        
        <div className="max-w-screen-lg mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[
            { 
              title: "98%", 
              subtitle: "Detection Accuracy", 
              description: "Our AI consistently identifies road damage with near-perfect precision.",
              icon: BarChart2,
              color: "from-green-400 to-green-600"
            },
            { 
              title: "10x", 
              subtitle: "Faster Than Manual", 
              description: "Automated inspections that save thousands of work hours annually.",
              icon: Zap,
              color: "from-teal-400 to-teal-600" 
            },
            { 
              title: "24/7", 
              subtitle: "Automated Monitoring", 
              description: "Continuous infrastructure assessment without human intervention.",
              icon: Shield,
              color: "from-cyan-400 to-cyan-600" 
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 group hover:-translate-y-2"
              variants={fadeIn}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 bg-gradient-to-br ${stat.color} text-white`}>
                <stat.icon size={28} />
              </div>
              <h3 className="text-4xl font-extrabold text-gray-900 group-hover:text-green-600 transition-colors">{stat.title}</h3>
              <p className="text-gray-700 font-semibold mt-1 text-lg">{stat.subtitle}</p>
              <p className="text-gray-600 mt-4">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Team Section removed as requested */}

      {/* CTA Section */}
      <section className="px-6 md:px-20 py-20 bg-gradient-to-r from-green-50 to-teal-50">
        <motion.div 
          className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 bg-gradient-to-br from-green-600 to-teal-600 text-white">
              <h3 className="text-3xl font-bold mb-4">Ready to transform your city's infrastructure?</h3>
              <p className="text-green-50 mb-6">
                Join hundreds of municipalities already using our platform to make their roads safer and maintenance more efficient.
              </p>
              <ul className="space-y-2 mb-8">
                {["AI-powered road inspections", "Real-time monitoring", "Instant results", "Cost-effective solutions "].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Get Started Today</h4>
              <p className="text-gray-600 mb-6">
                Start a demo or start your journey to see how our platform can work for your city.
              </p>
              <div className="space-y-3">
                <Link to="/signup" className="block">
                  <button className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all">
                    Start now !
                  </button>
                </Link>
                <Link to="/contact" className="block">
                  <button className="w-full bg-white border border-gray-300 text-gray-700 hover:text-green-700 hover:border-green-300 px-6 py-3 rounded-xl font-semibold transition-all">
                    Start a Demo
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
