import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Check for saved email in localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors
    setLoading(true);
    console.log("Login attempt for:", email);

    // Save email if remember me is checked
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }
    
    // SIMPLE ADMIN LOGIN - No verification needed
    if (email === "admin123@gmail.com" && password === "admin1234567890") {
      console.log("Admin login detected - going directly to admin dashboard");
      
      // Store admin info in localStorage
      localStorage.setItem("user", JSON.stringify({ email }));
      localStorage.setItem("roadVisionUserId", "admin_" + Date.now());
      localStorage.setItem("roadVisionUserName", "Administrator");
      localStorage.setItem("roadVisionUserType", "admin");
      localStorage.setItem("roadVisionIsAdmin", "true");
      
      // Go directly to admin dashboard
      setLoading(false);
      navigate("/admin");
      return;
    }

    // For non-admin users, try server login
    try {
      console.log("Sending login request to server...");
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Server response status:", response.status);
      const data = await response.json();
      console.log("Server response data:", data);

      if (response.ok) {
        console.log("Login successful:", data);
        // Store user information
        localStorage.setItem("user", JSON.stringify({ email }));
        localStorage.setItem("roadVisionUserId", data.userId || "user_" + Date.now());
        localStorage.setItem("roadVisionUserName", data.name || email.split('@')[0]);
        localStorage.setItem("roadVisionUserType", data.userType || "user");
        localStorage.setItem("roadVisionIsAdmin", data.isAdmin ? "true" : "false");
        
        setLoading(false);
        
        // Redirect to user dashboard
        console.log("Redirecting to user dashboard");
        navigate("/user");
      } else {
        console.error("Login failed:", data.error);
        setLoading(false);
        setErrorMessage(data.error || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setLoading(false);
      setErrorMessage("Server error. Try again!");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="min-h-screen flex items-center justify-center p-6 pt-20">
        <div className="bg-white shadow-2xl rounded-3xl flex w-full max-w-5xl overflow-hidden">
          
          {/* Left: Login Form */}
          <div className="w-full md:w-1/2 p-10 md:p-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Login to continue to your dashboard</p>
            </div>

            {/* Email & Password Form */}
            <form className="space-y-6" onSubmit={handleLogin}>
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter your password"
                    required
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
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                  <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

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
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={18} className="mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-8 text-center">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                onClick={() => navigate("/signup")}
              >
                Sign up for free
              </button>
            </p>
          </div>

          {/* Right: Login Illustration with greenish background */}
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
                <h2 className="text-3xl font-bold text-white mb-6">Road Damage Detection & Management</h2>
                <p className="text-white/80 mb-8 leading-relaxed">
                  Identify, report, and manage road infrastructure issues with our AI-powered platform. Help create safer roads for everyone.
                </p>
                
                <div className="space-y-4">
                  {[
                    "AI-powered damage detection",
                    "Real-time reporting system",
                    "Comprehensive analytics dashboard",
                    "Maintenance tracking & prioritization"
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
                    <p className="text-white font-medium">"This platform has transformed how we manage road maintenance in our city."</p>
                    <p className="text-white/70 text-sm mt-1">- City Infrastructure Manager</p>
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

export default LoginPage;