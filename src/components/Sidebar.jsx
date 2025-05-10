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
  FaLeaf,
} from "react-icons/fa";
import { Camera } from "lucide-react";

const Sidebar = ({ activeTab, userName, userId }) => {
  const navigate = useNavigate();

  // Determine if user is admin
  const isAdmin = userId && userId.startsWith('admin_');
  
  // Define navigation items based on user role
  const adminNavItems = [
    { name: "Dashboard", path: "/admin", icon: <FaHome className="text-lg" /> },
    { name: "Image Uploads", path: "/authority", icon: <FaImage className="text-lg" /> },
    { name: "Map", path: "/map", icon: <FaMap className="text-lg" /> },
    { name: "View Reports", path: "/report", icon: <FaChartArea className="text-lg" /> },
    { name: "View Feedbacks", path: "/view", icon: <FaAddressCard className="text-lg" /> },
    { name: "Logout", path: "/", icon: <FaSignOutAlt className="text-lg" /> },
  ];
  
  const userNavItems = [
    { name: "Dashboard", path: "/user", icon: <FaHome className="text-lg" /> },
    { name: "Camera", path: "/camera", icon: <Camera className="text-lg" /> },
    { name: "History", path: "/history", icon: <FaTable className="text-lg" /> },
    { name: "Logout", path: "/", icon: <FaSignOutAlt className="text-lg" /> },
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
    <div className="w-64 min-w-[16rem] bg-white shadow-lg h-screen fixed left-0 top-0 overflow-y-auto z-30 border-r border-green-100">
      {/* Logo and Welcome */}
      <div className="p-6 bg-gradient-to-b from-green-50 to-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
            <FaLeaf className="text-xl" />
          </div>
          <h1 className="text-green-800 font-bold text-xl">Inspectify</h1>
        </div>
        
        {userName && (
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-green-100">
            <p className="text-green-700 text-xs font-medium mb-2 uppercase tracking-wider">Current User</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-800 shadow-inner border-2 border-green-200">
                <span className="text-lg font-semibold">{getInitial(userName)}</span>
              </div>
              <div>
                <p className="text-gray-800 font-medium">{userName}</p>
                <p className="text-green-600 text-xs font-medium">{isAdmin ? "Administrator" : "Regular User"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation Items */}
      <div className="px-4 py-2">
        <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-2 ml-2">Navigation</p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li
              key={item.name}
              onClick={() => handleTabChange(item.name)}
              className={`p-3 cursor-pointer flex items-center gap-3 rounded-lg transition-all ${
                activeTab === item.name 
                  ? "bg-green-600 text-white shadow-md" 
                  : "text-gray-700 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              <div className={`${activeTab === item.name ? "text-white" : "text-green-600"}`}>
                {item.icon}
              </div>
              <span className="font-medium">{item.name}</span>
              {activeTab === item.name && (
                <div className="w-1.5 h-1.5 rounded-full bg-white ml-auto"></div>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Footer */}
      <div className="px-6 mt-auto mb-6 absolute bottom-0 left-0 right-0">
        <div className="border-t border-green-100 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium">
                &copy; {new Date().getFullYear()} Inspectify
              </p>
              <p className="text-xs text-gray-500">Version 1.0.0</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <FaLeaf className="text-green-600 text-xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;