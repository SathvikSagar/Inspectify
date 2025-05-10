import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import { BACKEND_URL, endpoints } from "../utils/apiConfig";

const User = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication and user type
    const checkAuth = async () => {
      setLoading(true);
      const userId = localStorage.getItem("roadVisionUserId");
      const userName = localStorage.getItem("roadVisionUserName");
      const userType = localStorage.getItem("roadVisionUserType");
      const isAdmin = localStorage.getItem("roadVisionIsAdmin") === "true";

      if (!userId) {
        console.log("No user ID found, redirecting to login");
        navigate('/');
        return;
      }

      // Set username from localStorage
      if (userName) {
        setUsername(userName);
      } else {
        setUsername("User");
      }

      // Check if user is admin based on localStorage first
      if (isAdmin || userType === 'admin') {
        console.log("Admin user detected in User component, redirecting to admin page");
        navigate('/admin');
        return;
      }

      // Verify with server
      try {
        // Check if we should skip server verification (for development/testing)
        const skipServerVerification = localStorage.getItem('skipServerVerification') === 'true';
        
        if (skipServerVerification) {
          console.log("Skipping server verification as requested");
          setUsername(userName || "User");
          setLoading(false);
          return;
        }
        
        console.log(`Verifying authentication with server at: ${endpoints.verifyAuth}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(endpoints.verifyAuth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log("Authentication response:", data);
        
          if (response.ok && data.authenticated) {
            // If authenticated but as admin, redirect to admin dashboard
            if (data.userType === 'admin' || data.isAdmin) {
              console.log("Admin user verified, redirecting to admin page");
              // Update localStorage with server response
              localStorage.setItem("roadVisionUserType", "admin");
              localStorage.setItem("roadVisionIsAdmin", "true");
              navigate('/admin');
              return;
            }
            
            // Update user name if provided
            if (data.name && data.name !== username) {
              setUsername(data.name);
              localStorage.setItem("roadVisionUserName", data.name);
            }
            
            // Update user type in localStorage
            localStorage.setItem("roadVisionUserType", data.userType || "user");
            localStorage.setItem("roadVisionIsAdmin", data.isAdmin ? "true" : "false");
            
            setLoading(false);
          } else {
            // Authentication failed, redirect to login
            console.log("Authentication failed:", data.message);
            localStorage.removeItem('roadVisionUserId');
            localStorage.removeItem('roadVisionUserName');
            localStorage.removeItem('roadVisionUserType');
            localStorage.removeItem('roadVisionIsAdmin');
            navigate('/');
          }
        } else {
          // Handle non-JSON response (likely HTML error page)
          console.log("Server returned non-JSON response. Status:", response.status);
          const text = await response.text();
          console.log("Response preview:", text.substring(0, 100) + "...");
          
          // Continue with local data since server verification failed
          console.log("Continuing with local user data");
          setUsername(localStorage.getItem("roadVisionUserName") || "User");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error verifying authentication:", error);
        
        // Handle timeout or network errors gracefully
        if (error.name === 'AbortError') {
          console.log("Authentication request timed out. Using local data.");
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          console.log("Network error. Backend server may be unavailable. Using local data.");
          
          // Set a flag to skip server verification for future requests
          localStorage.setItem('skipServerVerification', 'true');
          
          // After 5 minutes, try again
          setTimeout(() => {
            localStorage.removeItem('skipServerVerification');
          }, 5 * 60 * 1000);
        }
        
        // Continue with local data
        setUsername(userName || "User");
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying user access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {username}!</h1>
      </div>
      <Dashboard />
    </div>
  );
};

export default User;
