import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaSignOutAlt,
  FaMap,
  FaImage,
  FaChartArea,
  FaAddressCard,
  FaTable,
} from "react-icons/fa";
import { Camera } from "lucide-react";

const Sidebar = ({ activeTab, userName, userId }) => {
  const navigate = useNavigate();

  // Determine if user is admin
  const isAdmin = userId && userId.startsWith('admin_');
  
  // Define navigation items based on user role
  const adminNavItems = [
    { name: "Dashboard", path: "/admin", icon: <FaHome /> },
    { name: "Image Uploads", path: "/authority", icon: <FaImage /> },
    { name: "Map", path: "/map", icon: <FaMap /> },
    { name: "View Reports", path: "/report", icon: <FaChartArea /> },
    { name: "View Feedbacks", path: "/view", icon: <FaAddressCard /> },
    { name: "Logout", path: "/", icon: <FaSignOutAlt /> },
  ];
  
  const userNavItems = [
    { name: "Dashboard", path: "/user", icon: <FaHome /> },
    { name: "Camera", path: "/camera", icon: <Camera /> },
    { name: "History", path: "/history", icon: <FaTable /> },
    { name: "Logout", path: "/", icon: <FaSignOutAlt /> },
  ];
  
  // Use the appropriate navigation items based on user role
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleTabChange = (tab) => {
    // Find the matching nav item
    const navItem = navItems.find(item => item.name === tab);
    
    if (tab === "Logout") {
      // Clear all user-specific data
      localStorage.removeItem("roadVisionUserId");
      localStorage.removeItem("roadVisionUserName");
      localStorage.removeItem("roadVisionUserType");
      localStorage.removeItem("roadVisionIsAdmin");
      localStorage.removeItem("user");
      
      // Always navigate to login page on logout
      navigate("/");
      return;
    }
    
    // Navigate to the appropriate path
    if (navItem) {
      // Check if user is trying to access admin pages
      const isAdminPage = ["/admin", "/authority", "/map", "/report", "/view"].includes(navItem.path);
      const isUserPage = ["/user", "/camera", "/history"].includes(navItem.path);
      
      if (isAdminPage && !isAdmin) {
        // If a regular user tries to access admin pages, redirect to user dashboard
        console.log("Regular user attempting to access admin page, redirecting to user dashboard");
        navigate("/user");
      } else if (isUserPage && isAdmin) {
        // If an admin tries to access user pages, redirect to admin dashboard
        console.log("Admin attempting to access user page, redirecting to admin dashboard");
        navigate("/admin");
      } else {
        // Normal navigation
        navigate(navItem.path);
      }
    }
  };

  // Get first letter of username for avatar
  const getInitial = (name) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div className="w-64 min-w-[16rem] bg-white shadow-lg h-screen fixed left-0 top-0 overflow-y-auto z-30">
      {/* Logo and Welcome */}
      <div className="p-6">
        <div className="bg-gradient-to-r from-blue-600 to-green-500 p-3 rounded-lg mb-4 flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg">
            <Camera size={20} className="text-green-700" />
          </div>
          <h1 className="text-white font-bold text-xl">RoadVision</h1>
        </div>
        
        {userName && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-gray-500 text-xs font-medium mb-1">CURRENT USER</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800">
                <span className="text-lg font-semibold">{getInitial(userName)}</span>
              </div>
              <div>
                <p className="text-gray-800 font-medium">{userName}</p>
                <p className="text-gray-500 text-xs">{isAdmin ? "Administrator" : "Regular User"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation Items */}
      <div className="px-4">
        <ul>
          {navItems.map((item) => (
            <li
              key={item.name}
              onClick={() => handleTabChange(item.name)}
              className={`p-3 cursor-pointer flex items-center gap-2 rounded-lg mb-2 transition-all ${
                activeTab === item.name ? "bg-green-800 text-white" : "hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {item.name}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Footer */}
      <div className="px-6 mt-8 mb-6">
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} RoadVision
            <br />
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;