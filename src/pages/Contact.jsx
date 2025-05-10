import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Send, User, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    
    // Get user info from localStorage on component mount
    useEffect(() => {
        const storedUserId = localStorage.getItem('roadVisionUserId');
        const storedUserName = localStorage.getItem('roadVisionUserName');
        
        if (storedUserId) {
            setUserId(storedUserId);
        }
        
        if (storedUserName) {
            setUserName(storedUserName);
            // Pre-fill name field if user is logged in
            setFormData(prev => ({
                ...prev,
                name: storedUserName
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
    
        try {
            // Include userId if available
            const feedbackData = {
                ...formData,
                userId: userId // Include userId to associate feedback with the user
            };
            
            const response = await fetch('https://inspectify-backend.onrender.com/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackData)
            });
    
            const data = await response.json();
    
            if (response.ok) {
                setSuccess(true);
                // Keep the name if user is logged in, otherwise reset all fields
                if (userId) {
                    setFormData({ name: userName, email: '', subject: '', message: '' });
                } else {
                    setFormData({ name: '', email: '', subject: '', message: '' });
                }
            } else {
                setError(data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };
    
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };
    
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    return (
        <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen pt-20">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-block mb-3">
                        <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent text-sm font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-green-200">
                            Get In Touch
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Contact Us</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        We'd love to hear from you! Reach out for any questions, feedback, or to learn more about our services.
                    </p>
                </motion.div>
            </div>

            {/* Contact Info Cards + Form Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info Cards */}
                    <motion.div 
                        className="lg:col-span-1 space-y-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div 
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                            variants={itemVariants}
                        >
                            <div className="flex items-center mb-4">
                                <div className="bg-green-100 p-3 rounded-xl mr-4">
                                    <Mail className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Email Us</h3>
                                    <p className="text-gray-600">We'll respond within 24 hours</p>
                                </div>
                            </div>
                            <a href="mailto:support@roadinspect.com" className="text-green-600 font-medium hover:text-green-700 transition-colors">
                                safestreet386@gmail.com
                            </a>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                            variants={itemVariants}
                        >
                            <div className="flex items-center mb-4">
                                <div className="bg-green-100 p-3 rounded-xl mr-4">
                                    <Phone className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Call Us</h3>
                                    <p className="text-gray-600">Mon-Fri from 8am to 5pm</p>
                                </div>
                            </div>
                            <a href="tel:+1234567890" className="text-green-600 font-medium hover:text-green-700 transition-colors">
                                +91 7989841976
                            </a>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                            variants={itemVariants}
                        >
                            <div className="flex items-center mb-4">
                                <div className="bg-green-100 p-3 rounded-xl mr-4">
                                    <MapPin className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Visit Us</h3>
                                    <p className="text-gray-600">Admin office</p>
                                </div>
                            </div>
                            <p className="text-gray-700">
                            Koheda Road<br />
                            Ibrahimpatnam <br />
                            Rangareddy, Telangana 501510<br />
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div 
                        className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
                        
                        {success && (
                            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start">
                                <CheckCircle className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-green-800 font-medium">Message sent successfully!</p>
                                    <p className="text-green-700 mt-1">Thank you for reaching out. We'll get back to you shortly.</p>
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                                <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-red-800 font-medium">There was a problem</p>
                                    <p className="text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="How can we help you?"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                        <MessageSquare size={18} className="text-gray-400" />
                                    </div>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="5"
                                        className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="Tell us what you need help with..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-70"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} className="mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>

         

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                    <p className="text-lg text-gray-600">Find answers to common questions about our services</p>
                </div>
                
                <div className="space-y-6">
                    {[
                        {
                            question: "1. What is SafeStreet and how does it work?",
                            answer: "SafeStreet is an AI-powered web app that detects road damages (like potholes or cracks) from uploaded or captured images. It automatically identifies the type and severity of the damage, tags the location, and stores the result for reporting and review."
                        },
                        {
                            question: "2. How do I upload or capture an image for analysis?",
                            answer: "Go to the Camera tab in the app. You can either capture a photo using your device's camera or upload an existing image. Once submitted, the system will analyze the image and provide a prediction along with location data."
                        },
                        {
                            question: "3. What types of road damage does SafeStreet detect?",
                            answer: "Currently, SafeStreet can identify the following common road damages: Potholes, Longitudinal cracks, Lateral cracks, Alligator cracks. More damage types may be added in future updates."
                        },
                        {
                            question: "4. How does SafeStreet determine the location of the damage?",
                            answer: "When you capture or upload an image, SafeStreet uses your device's GPS (with your permission) to automatically tag the location. This ensures accurate geo-reporting for maintenance or municipal review."
                        },
                        {
                            question: "5. Are my images and data stored securely?",
                            answer: "Yes. Only images identified as damaged roads are saved, along with timestamp and location. Your data is securely stored in our backend system (MongoDB) and is not shared with third parties."
                        },
                        {
                            question: "6. Can I view past reports or saved results?",
                            answer: "Yes, visit the History or Saved tab to view all your previously submitted road damage reports, including images, predicted damage type, location, and date/time of upload."
                        }
                    ].map((faq, index) => (
                        <motion.div 
                            key={index}
                            className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                            <p className="text-gray-600">{faq.answer}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Contact;
// import { useState } from "react";

// const Contact = () => {
//     const [image, setImage] = useState(null);

//     // Function to handle image selection
//     const handleImageChange = (e) => {
//         const file = e.target.files[0];
//         if (file) {
//             setImage(file);
//         }
//     };

//     return (
//         <div className="flex flex-col items-center p-4 border rounded-lg shadow-md">
//             <input type="file" accept="image/*" onChange={handleImageChange} />
//             {image && (
//                 <p className="mt-2">Selected: {image.name}</p>
//             )}
//         </div>
//     );
// };

// export default Contact;
