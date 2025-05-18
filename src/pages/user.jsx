import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import Sidebar from "../components/Sidebar";

const User = () => {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  // Effect to check if we're on mobile and update sidebar state accordingly
  useEffect(() => {
    const checkIfMobile = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Check on initial load
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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
        const response = await fetch('http://localhost:5000/api/verify-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        
        const data = await response.json();
        
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
      } catch (error) {
        console.error("Error verifying authentication:", error);
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
