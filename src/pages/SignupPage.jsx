import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, UserPlus, CheckCircle, KeyRound } from "lucide-react";
import emailjs from '@emailjs/browser';
import { storeOTP, verifyOTP, removeOTP } from "../utils/otpUtils";

// Initialize EmailJS with your public key
emailjs.init("e2ywgLyBWrbsCxIw9");

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Function to send OTP via email using EmailJS
  const sendOtpEmail = async (otpCode) => {
    try {
      // Log the OTP to the console for debugging
      console.log(`OTP for ${email}: ${otpCode}`);
      
      // Prepare the template parameters with common parameter names
      const templateParams = {
        to_name: name,
        to_email: email,
        from_name: "SafeStreet App",
        message: `Your verification code is: ${otpCode}`,
        subject: "Your Verification Code",
        otp: otpCode // Add OTP as a separate parameter for template
      };
      
      console.log('Sending email with parameters:', {
        service_id: 'service_wbi1a36',
        template_id: 'template_073bu4c',
        template_params: templateParams
      });
      
      // Send the email using EmailJS
      const response = await emailjs.send(
        'service_wbi1a36',    // Your EmailJS service ID
        'template_073bu4c',   // Your specific OTP template ID
        templateParams
      );
      
      console.log('Email sent successfully:', response);
      
      // Success message for the user
      setSuccessMessage(`Verification code sent to ${email}. Please check your inbox and spam folder.`);
      
      return true;
    } catch (error) {
      console.error("Error sending OTP email:", error);
      
      // For development/testing, still show the OTP in the UI if email sending fails
      setSuccessMessage(`Your verification code is: ${otpCode}`);
      
      // Log detailed error information
      if (error.status) {
        console.error(`EmailJS Status: ${error.status}, Text: ${error.text}`);
      }
      
      return true; // Return true to continue the flow even if email fails
    }
  };

  // Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!name || !email || !password) {
      setErrorMessage("All fields are required");
      setLoading(false);
      return;
    }

    try {
      // Log the request for debugging
      console.log("Requesting OTP from server for:", { name, email });
      
      // Request OTP from the server
      const response = await fetch("http://localhost:5000/api/generate-otp", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      console.log("Server response:", data);
      
      if (response.ok) {
        // Check if email was sent successfully
        if (data.emailSent) {
          setSuccessMessage(`Verification code sent to ${email}. Please check your inbox and spam folder.`);
        } else {
          // If email sending failed but OTP was generated
          if (data.otp) {
            setSuccessMessage(`Email sending failed. Your verification code is: ${data.otp}`);
          } else {
            setSuccessMessage("Verification code generated but email sending failed. Please try again.");
          }
        }
        
        // For development, if OTP is returned in the response, store it locally
        if (data.otp) {
          storeOTP(email, name, password, data.otp);
        }
        
        // Show OTP form
        setShowOtpForm(true);
        setOtpSent(true);
        setCountdown(60); // 60 seconds countdown for resend
      } else {
        setErrorMessage(data.error || "Failed to generate OTP. Please try again.");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("OTP Request Error:", error);
      setLoading(false);
      setErrorMessage("Error connecting to server. Please try again.");
    }
  };

  // Verify OTP and complete signup
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // First try to verify OTP locally (for development fallback)
      console.log("Verifying OTP locally first:", { email, otp });
      const localResult = verifyOTP(email, otp);
      console.log("Local OTP verification result:", localResult);

      if (localResult.valid) {
        // OTP is valid locally, create the user
        try {
          const { name, email, password } = localResult.userData;
          
          // Create user in the backend
          const response = await fetch("http://localhost:5000/api/signup", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ name, email, password }),
          });
          
          console.log("Signup response status:", response.status);
          
          const data = await response.json();
          console.log("Signup response data:", data);
          
          if (response.ok) {
            // Remove the OTP after successful verification
            removeOTP(email);
            
            setSuccessMessage("Signup successful! Redirecting to login...");
            
            // Redirect to login page after successful verification
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          } else {
            setErrorMessage(data.error || "Signup failed. Please try again.");
          }
        } catch (error) {
          console.error("Signup Error:", error);
          setErrorMessage("Error creating user. Please try again.");
        }
      } else {
        // If local verification fails, try server verification
        try {
          console.log("Trying server OTP verification:", { email, otp });
          
          // Verify OTP with the server
          const verifyResponse = await fetch("http://localhost:5000/api/verify-otp", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ email, otp }),
          });
          
          const verifyData = await verifyResponse.json();
          console.log("Server OTP verification response:", verifyData);
          
          if (verifyResponse.ok) {
            setSuccessMessage("Signup successful! Redirecting to login...");
            
            // Redirect to login page after successful verification
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          } else {
            setErrorMessage(verifyData.error || "OTP verification failed. Please try again.");
          }
        } catch (serverError) {
          console.error("Server OTP Verification Error:", serverError);
          setErrorMessage("Error connecting to server. Please try again.");
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("OTP Verification Error:", error);
      setLoading(false);
      setErrorMessage("Error during OTP verification.");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return; // Prevent resend if countdown is active
    
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Log resend attempt for debugging
      console.log("Resending OTP locally for:", { email, name });
      
      // Generate new OTP locally
      const otp = storeOTP(email, name, password);
      console.log("New OTP generated:", otp);
      
      // Always show the OTP in the UI for testing
      setSuccessMessage(`Your new verification code is: ${otp}`);
      
      try {
        // Try to send the OTP via email (this will likely fail, but we'll try anyway)
        await sendOtpEmail(otp);
      } catch (emailError) {
        console.error("Email sending failed, but continuing with OTP flow:", emailError);
        // Email failed, but we've already shown the OTP in the UI
      }
      
      setCountdown(60); // Reset countdown
      setLoading(false);
    } catch (error) {
      console.error("Resend OTP Error:", error);
      setLoading(false);
      setErrorMessage("Error generating new OTP. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="min-h-screen flex items-center justify-center p-6 pt-20">
        <div className="bg-white shadow-2xl rounded-3xl flex w-full max-w-5xl overflow-hidden">
          
          {/* Left: Signup Form */}
          <div className="w-full md:w-1/2 p-10 md:p-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Create an Account</h2>
              <p className="text-gray-600">Join us to start reporting road issues</p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start mb-6">
                <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start mb-6">
                <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* OTP Verification Form */}
            {showOtpForm ? (
              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-700">
                    We've sent a verification code to <strong>{email}</strong>. 
                    Please check your email (including spam folder) and enter the code below to complete your registration.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 bg-white"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} className="mr-2" />
                        Verify & Complete Signup
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || countdown > 0}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {countdown > 0 
                      ? `Resend code in ${countdown}s` 
                      : "Didn't receive the code? Resend"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpForm(false);
                      setOtp("");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Back to signup
                  </button>
                </div>
              </form>
            ) : (
              /* Initial Signup Form */
              <form className="space-y-6" onSubmit={handleRequestOtp}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 bg-white"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 bg-white"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 bg-white"
                      placeholder="Create a strong password"
                      required
                      minLength={8}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye size={18} className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending verification code...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} className="mr-2" />
                      Continue with Email Verification
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-8 text-center">
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Right: Signup Illustration with greenish background */}
          <div className="hidden md:block w-1/2 bg-gradient-to-br from-green-500 to-teal-600 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              <svg width="100%" height="100%" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                  <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                    <rect width="100" height="100" fill="url(#smallGrid)"/>
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            
            <div className="relative z-10 h-full flex flex-col justify-between p-12">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Join Our Road Maintenance Community</h2>
                <p className="text-white/80 mb-8 leading-relaxed">
                  By creating an account, you'll be able to report road issues, track repairs, and help improve infrastructure in your community.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Report road damage with photos and location",
                    "Track the status of your reports",
                    "Receive updates on nearby repairs",
                    "Contribute to safer roads for everyone"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="h-5 w-5 text-white/70 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">"Since joining, I've reported 5 potholes that have been fixed within weeks!"</p>
                    <p className="text-white/70 text-sm mt-1">- Community Member</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignupPage;
