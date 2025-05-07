import { useEffect, useState, useRef } from "react";
import { FaHome, FaCamera, FaClock, FaSave, FaAddressCard, FaSign, FaSignOutAlt } from "react-icons/fa"; 
import { Bell, AlertTriangle, CheckCircle, Clock, X, Camera, MapPin, FileText, Search } from "lucide-react";
import axios from "axios";
import UserLocationMap from "../components/UserLocationMap";  
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");

  // Location
  const [location, setLocation] = useState(null);
  const [hasFetchedLocation, setHasFetchedLocation] = useState(false);

  // Image & Prediction
  const [selectedFile, setSelectedFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Get user info from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('roadVisionUserId');
    const storedUserName = localStorage.getItem('roadVisionUserName');
    
    if (storedUserId) {
      setUserId(storedUserId);
      
      // Check if user is admin and redirect if needed
      const isAdmin = storedUserId.startsWith('admin_');
      if (isAdmin) {
        console.log("Admin user detected in Dashboard component, redirecting to admin page");
        navigate('/admin');
      }
    } else {
      // If no user ID is found, redirect to login
      console.log("No user ID found, redirecting to login");
      navigate('/');
    }
    
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, [navigate]);

  // Camera
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Saved Data
  const [savedImages, setSavedImages] = useState([]);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  
  // Road statistics
  const [roadStats, setRoadStats] = useState({
    sanctioned: 0,
    pending: 0,
    repaired: 0
  });

  // 📍 Get Location
  const getLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();
          setLocation({ lat, lon, address: data.display_name });
          setHasFetchedLocation(true);
        } catch (err) {
          setError("Failed to fetch address.");
        }
        setLoading(false);
      },
      () => {
        setError("Location access denied. Please enable location services.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // 🎥 Camera Stream
  useEffect(() => {
    if (streamActive) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera access denied:", err);
          setError("Failed to access camera.");
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    }
  }, [streamActive]);

  // 📸 Capture Image
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], "captured.jpg", { type: "image/jpeg" });
      setSelectedFile(file);
      setPrediction(null);
      setError("");
    }, "image/jpeg");
  };

  // 🧠 Auto-fetch location on entering Camera tab
  useEffect(() => {
    if (activeTab === "Camera" && !hasFetchedLocation) {
      getLocation();
    }
  }, [activeTab, hasFetchedLocation]);

  // 📁 Select File
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPrediction(null);
    setError("");
  };

  // 🚀 Predict
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select or capture an image first.");
      return;
    }

    if (!location) {
      setError("Location not available. Please allow location access.");
      return;
    }
    
    if (!userId) {
      setError("User ID not available. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("latitude", location.lat);
    formData.append("longitude", location.lon);
    formData.append("address", location.address);
    formData.append("userId", userId); // Always include userId

    setLoading(true);
    setPrediction(null);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { prediction, saved } = response.data;
      setPrediction({ label: prediction, saved });
    } catch (err) {
      console.error("Prediction error:", err);
      setError("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 📦 Load Saved Images
  const loadSavedImages = async () => {
    try {
      setLoading(true);
      // Only fetch images for the current user if userId is available
      const url = userId 
        ? `http://localhost:5000/api/road-entries?userId=${userId}`
        : "http://localhost:5000/api/road-entries";
        
      const response = await axios.get(url);
      setSavedImages(response.data);
    } catch (error) {
      console.error("Failed to fetch saved images:", error);
      setError("Failed to load image history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Trigger when entering History tab
  useEffect(() => {
    if (activeTab === "History") {
      loadSavedImages();
    }
  }, [activeTab]);
  
  // Load saved notifications from localStorage on component mount - user specific
  useEffect(() => {
    if (userId) {
      const savedNotifications = localStorage.getItem(`roadVisionNotifications_${userId}`);
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
        } catch (error) {
          console.error('Error parsing saved notifications:', error);
        }
      }
    }
  }, [userId]);

  // Save notifications to localStorage whenever they change and update road statistics - user specific
  useEffect(() => {
    if (notifications.length > 0 && userId) {
      localStorage.setItem(`roadVisionNotifications_${userId}`, JSON.stringify(notifications));
      
      // Calculate road statistics from notifications
      const sanctioned = notifications.filter(n => 
        n.details && n.details.status === 'approved'
      ).length;
      
      const pending = notifications.filter(n => 
        n.details && (n.details.status === 'pending' || n.details.status === 'in-progress')
      ).length;
      
      const repaired = notifications.filter(n => 
        n.details && n.details.action && n.details.action.toLowerCase().includes('repair') && 
        n.details.status === 'approved'
      ).length;
      
      setRoadStats({
        sanctioned,
        pending,
        repaired
      });
    }
  }, [notifications]);

  // Socket.IO connection for real-time notifications
  useEffect(() => {
    // Only connect to socket.io if we have a userId
    if (!userId) return;
    
    // Import socket.io-client dynamically
    import('socket.io-client').then(({ io }) => {
      console.log("Connecting to socket.io server with userId:", userId);
      
      const socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });
      
      socket.on('connect', () => {
        console.log('Socket.IO connected in Dashboard');
        // Authenticate with the server using userId
        socket.emit('authenticate', userId);
      });
      
      socket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        // Re-authenticate after reconnection
        socket.emit('authenticate', userId);
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error in Dashboard:', error);
      });
      
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
      });
      
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      // Listen for image review notifications
      socket.on('image-reviewed', (data) => {
        console.log("Received direct notification:", data);
        console.log("Current user ID:", userId);
        
        const isAdmin = userId.startsWith('admin_');
        
        // Simplified logic: Process notification if it's meant for this user type
        // or if it's specifically for this user
        const isForThisUser = (isAdmin && data.forAdmin) || (!isAdmin && data.forUser);
        
        // Also check if this is specifically for this admin (if adminId is provided)
        const isForSpecificAdmin = isAdmin && data.adminId && data.adminId === userId;
        
        // Process if it's for this user type or specifically for this admin
        if (!isForThisUser && !isForSpecificAdmin) {
          console.log(`User ${userId} ignoring notification not meant for them`);
          return;
        }
        
        console.log(`Processing direct notification for ${isAdmin ? 'admin' : 'user'}: ${userId}`);
        
        const newNotification = {
          id: Date.now(),
          type: 'review',
          title: isAdmin ? 'Admin: Image Review Update' : 'Your Image Review Update',
          message: data.message,
          details: {
            status: data.reviewStatus,
            severity: data.severity,
            notes: data.reviewNotes,
            action: data.recommendedAction,
            date: new Date(data.reviewDate).toLocaleString(),
            address: data.address,
            reviewerId: data.reviewerId, // Store who reviewed the image
            forAdmin: data.forAdmin,
            forUser: data.forUser
          },
          imagePath: data.imagePath,
          timestamp: new Date(),
          read: false,
          userId: data.userId // Store the user ID with the notification
        };
        
        console.log("Adding new notification from direct event:", newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        
        // Force showing the notification
        console.log("Setting showNotification to true");
        setShowNotification(true);
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          console.log("Auto-hiding notification");
          setShowNotification(false);
        }, 10000);
      });
      
      // Listen for user broadcast notifications (backup method)
      socket.on('image-reviewed-broadcast', (data) => {
        console.log("Received user broadcast notification:", data);
        
        // Only process if this broadcast is meant for this specific user
        if (data.targetUserId !== userId) {
          console.log(`Ignoring broadcast notification meant for user ${data.targetUserId}`);
          return;
        }
        
        console.log(`Processing broadcast notification for user ${userId}`);
        
        const newNotification = {
          id: Date.now(),
          type: 'review',
          title: 'Your Image Review Update',
          message: data.message,
          details: {
            status: data.reviewStatus,
            severity: data.severity,
            notes: data.reviewNotes,
            action: data.recommendedAction,
            date: new Date(data.reviewDate).toLocaleString(),
            address: data.address,
            reviewerId: data.reviewerId,
            forUser: data.forUser,
            forAdmin: data.forAdmin
          },
          imagePath: data.imagePath,
          timestamp: new Date(),
          read: false,
          userId: data.userId
        };
        
        console.log("Adding new notification from broadcast:", newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        
        // Force showing the notification
        console.log("Setting showNotification to true");
        setShowNotification(true);
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          console.log("Auto-hiding notification");
          setShowNotification(false);
        }, 10000);
      });
      
      // Listen for admin broadcast notifications (backup method)
      socket.on('admin-notification-broadcast', (data) => {
        console.log("Received admin broadcast notification:", data);
        
        // Only process if this is an admin user and the broadcast is meant for this specific admin
        const isAdmin = userId.startsWith('admin_');
        if (!isAdmin || data.targetAdminId !== userId) {
          console.log(`Ignoring admin broadcast notification not meant for this user`);
          return;
        }
        
        console.log(`Processing admin broadcast notification for admin ${userId}`);
        
        const newNotification = {
          id: Date.now(),
          type: 'review',
          title: 'Admin: Image Review Update',
          message: data.message,
          details: {
            status: data.reviewStatus,
            severity: data.severity,
            notes: data.reviewNotes,
            action: data.recommendedAction,
            date: new Date(data.reviewDate).toLocaleString(),
            address: data.address,
            reviewerId: data.reviewerId,
            forUser: data.forUser,
            forAdmin: data.forAdmin
          },
          imagePath: data.imagePath,
          timestamp: new Date(),
          read: false,
          userId: data.userId
        };
        
        console.log("Adding new admin notification from broadcast:", newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        
        // Force showing the notification
        console.log("Setting showNotification to true");
        setShowNotification(true);
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          console.log("Auto-hiding notification");
          setShowNotification(false);
        }, 10000);
        
        console.log("Adding new notification:", newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        
        // Force showing the notification
        console.log("Setting showNotification to true");
        setShowNotification(true);
        
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
          console.error("Error playing notification sound:", e);
        }
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          console.log("Auto-hiding notification");
          setShowNotification(false);
        }, 10000);
      });
      
      return () => {
        socket.disconnect();
      };
    }).catch(err => {
      console.error('Failed to load socket.io-client in Dashboard:', err);
    });
  }, [userId]); // Re-connect if userId changes

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  // Clear all notifications - user specific
  const clearAllNotifications = () => {
    setNotifications([]);
    if (userId) {
      localStorage.removeItem(`roadVisionNotifications_${userId}`);
    }
    setShowNotificationHistory(false);
  };

  // Notification component with improved styling
  const NotificationPanel = () => {
    console.log("NotificationPanel - showNotification:", showNotification);
    console.log("NotificationPanel - notifications:", notifications);
    
    if (!showNotification || notifications.length === 0) {
      console.log("NotificationPanel - Not showing panel");
      return null;
    }
    
    console.log("NotificationPanel - Showing panel");
    const latestNotification = notifications[0];
    
    return (
      <div className="fixed top-4 right-4 z-50 max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 transform translate-y-0 animate-slideIn">
        <div className={`px-4 py-3 text-white ${
          latestNotification.details.status === 'approved' ? 'bg-gradient-to-r from-green-600 to-green-500' :
          latestNotification.details.status === 'rejected' ? 'bg-gradient-to-r from-red-600 to-red-500' :
          latestNotification.details.status === 'in-progress' ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
          'bg-gradient-to-r from-gray-700 to-gray-600'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white bg-opacity-20 p-1.5 rounded-full">
                {latestNotification.details.status === 'approved' ? 
                  <CheckCircle className="h-4 w-4" /> : 
                  latestNotification.details.status === 'rejected' ? 
                  <AlertTriangle className="h-4 w-4" /> : 
                  <Clock className="h-4 w-4" />
                }
              </div>
              <h3 className="font-semibold">{latestNotification.title}</h3>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-5">
          <p className="mb-3 font-medium">{latestNotification.message}</p>
          
          <div className="mt-3 text-sm text-gray-600 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className={`font-medium ${
                  latestNotification.details.status === 'approved' ? 'text-green-600' :
                  latestNotification.details.status === 'rejected' ? 'text-red-600' :
                  latestNotification.details.status === 'in-progress' ? 'text-blue-600' :
                  'text-gray-700'
                }`}>
                  {latestNotification.details.status.charAt(0).toUpperCase() + latestNotification.details.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Severity</p>
                <p className={`font-medium ${
                  latestNotification.details.severity === 'severe' ? 'text-red-600' :
                  latestNotification.details.severity === 'high' ? 'text-orange-600' :
                  latestNotification.details.severity === 'moderate' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {latestNotification.details.severity.charAt(0).toUpperCase() + latestNotification.details.severity.slice(1)}
                </p>
              </div>
            </div>
            
            {latestNotification.details.notes && (
              <div className="pt-1">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-gray-700">{latestNotification.details.notes}</p>
              </div>
            )}
            
            {latestNotification.details.action && (
              <div className="pt-1">
                <p className="text-xs text-gray-500">Recommended Action</p>
                <p className="text-gray-700">{latestNotification.details.action}</p>
              </div>
            )}
            
            <div className="pt-1">
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-gray-700 truncate">{latestNotification.details.address}</p>
            </div>
            
            <div className="pt-1">
              <p className="text-xs text-gray-500">Review Date</p>
              <p className="text-gray-700">{latestNotification.details.date}</p>
            </div>
          </div>
          
          {latestNotification.imagePath && (
            <div className="mt-4">
              <img 
                src={`http://localhost:5000/${latestNotification.imagePath}`} 
                alt="Reviewed road" 
                className="w-full h-40 object-cover rounded-lg shadow-sm"
              />
            </div>
          )}
          
          <div className="mt-4 flex justify-between">
            <button 
              onClick={() => {
                markAsRead(latestNotification.id);
                setShowNotificationHistory(true);
                setShowNotification(false);
              }}
              className="px-3 py-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Notifications
            </button>
            <button 
              onClick={() => {
                markAsRead(latestNotification.id);
                setShowNotification(false);
              }}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 text-sm font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Notification History Panel
  const NotificationHistoryPanel = () => {
    if (!showNotificationHistory) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Notification History</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <button 
                  onClick={clearAllNotifications}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              )}
              <button 
                onClick={() => setShowNotificationHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border ${notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          notification.details.status === 'approved' ? 'bg-green-100 text-green-600' :
                          notification.details.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          notification.details.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {notification.details.status === 'approved' ? 
                            <CheckCircle className="h-5 w-5" /> : 
                            notification.details.status === 'rejected' ? 
                            <AlertTriangle className="h-5 w-5" /> : 
                            <Clock className="h-5 w-5" />
                          }
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="bg-blue-500 w-2 h-2 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="mt-3 pl-10">
                      <button 
                        onClick={() => {
                          markAsRead(notification.id);
                          // Create a temporary state to show this notification
                          const tempNotification = {...notification};
                          setNotifications(prev => 
                            prev.map(n => n.id === notification.id ? {...n, read: true} : n)
                          );
                          setShowNotificationHistory(false);
                          
                          // Show this notification in the notification panel
                          setTimeout(() => {
                            setNotifications(prev => [tempNotification, ...prev.filter(n => n.id !== tempNotification.id)]);
                            setShowNotification(true);
                          }, 100);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Notification Panels */}
      <NotificationPanel />
      <NotificationHistoryPanel />
      
      {/* Notification Badge */}
      {notifications.filter(n => !n.read).length > 0 && !showNotification && !showNotificationHistory && (
        <button
          onClick={() => setShowNotificationHistory(true)}
          className="fixed top-4 right-4 z-40 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {notifications.filter(n => !n.read).length}
          </span>
        </button>
      )}
      
      {/* Sidebar */}
      <div className="w-64 bg-white p-5 shadow-lg">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-green-500 p-2 rounded-lg mb-2">
        
          </div>
          {userName && (
            <div className="text-xl text-blue-600 mt-2">
              Welcome, <span className="font-bold">{userName}</span>
            </div>
          )}
        </div>
        
        <ul className="space-y-2">
          {[
            { name: "Dashboard", icon: <FaHome className="text-blue-600" /> },
            { name: "Camera", icon: <FaCamera className="text-green-600" /> },
            { name: "History", icon: <FaClock className="text-orange-500" /> },
            { name: "Notifications", icon: <Bell className="text-red-500" /> },
            { name: "Logout", icon: <FaSignOutAlt className="text-gray-600" /> }
          ].map((item) => (
            <li
              key={item.name}
              onClick={() => {
                if (item.name === "Notifications") {
                  setShowNotificationHistory(true);
                } else if (item.name === "Logout") {
                  // Clear user-specific data
                  localStorage.removeItem("roadVisionUserId");
                  localStorage.removeItem("roadVisionUserName");
                  localStorage.removeItem("user");
                  // Navigate to login page
                  navigate("/");
                } else {
                  setActiveTab(item.name);
                  setError("");
                  setPrediction(null);
                  if (item.name !== "Camera") setStreamActive(false);
                }
              }}
              className={`p-3 cursor-pointer flex items-center gap-3 rounded-lg transition-all ${
                activeTab === item.name 
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md" 
                  : "hover:bg-gray-100"
              }`}
            >
              <div className={`${activeTab === item.name ? "text-white" : ""}`}>
                {item.icon}
              </div>
              <span className="font-medium">{item.name}</span>
              
              {/* Notification badge */}
              {item.name === "Notifications" && notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </li>
          ))}
        </ul>
        
        <div className="mt-auto pt-6 border-t border-gray-200 mt-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">Help improve road safety by reporting issues in your area.</p>
          </div>
        </div>
      </div>

      {activeTab === "Camera" && (
  <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 p-8 overflow-y-auto text-gray-800 transition-all duration-300">
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Camera className="h-6 w-6" />
          </div>
          Road Issue Detection
        </h2>
        
        <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg text-blue-800">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <h3 className="font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Live Camera Feed
            </h3>
          </div>
          
          <div className="p-6">
            <div className="rounded-xl overflow-hidden shadow-inner h-80 flex items-center justify-center bg-gray-900 relative">
              {streamActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <div className="bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-lg">Camera preview will appear here</p>
                  <p className="text-gray-500 text-sm mt-2">Click "Start Camera" to begin</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
              
              {streamActive && (
                <div className="absolute bottom-4 right-4">
                  <div className="bg-red-600 h-3 w-3 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStreamActive((prev) => !prev)}
                className={`flex-1 py-3 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  streamActive 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {streamActive ? (
                  <>
                    <X className="h-4 w-4" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Start Camera
                  </>
                )}
              </button>
              
              {streamActive && (
                <button
                  onClick={captureImage}
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle className="h-4 w-4" />
                  Capture Image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload & Info Section */}
      <div className="space-y-6">
        {/* Location Info */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <MapPin className="h-5 w-5 text-red-500" />
            Location Information
          </h4>
          
          {loading ? (
            <div className="flex items-center gap-3 text-gray-500">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <p>Fetching your location...</p>
            </div>
          ) : location ? (
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="text-gray-800">{location.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Latitude</p>
                  <p className="text-gray-800 font-medium">{location.lat}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Longitude</p>
                  <p className="text-gray-800 font-medium">{location.lon}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Location Error</p>
                <p className="text-red-600 text-sm mt-1">{error || "Unable to access your location. Please enable location services."}</p>
              </div>
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <FileText className="h-5 w-5 text-blue-500" />
            Upload Road Image
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors flex flex-col justify-center items-center h-64">
              <input
                type="file"
                id="file-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-800 font-medium text-lg">Click to upload a road image</p>
                <p className="text-gray-500 text-sm mt-2">or drag and drop</p>
                <p className="text-gray-400 text-xs mt-4">Supports JPG, PNG, JPEG</p>
              </label>
            </div>
            
            {/* Image Preview */}
            <div className={`rounded-lg overflow-hidden border border-gray-200 shadow-sm h-64 flex items-center justify-center bg-gray-50 ${selectedFile ? '' : 'opacity-50'}`}>
              {selectedFile ? (
                <div className="relative w-full h-full">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 flex justify-between items-center">
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 text-gray-400">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Image preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Predict Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className={`w-full py-3 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            !selectedFile || loading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Processing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Analyze Road Condition
            </>
          )}
        </button>

        {/* Prediction Output */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}
        
        {prediction && (
          <div className={`p-5 rounded-lg border animate-fadeIn ${
            prediction.label.toLowerCase() === "road"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${
                prediction.label.toLowerCase() === "road"
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}>
                {prediction.label.toLowerCase() === "road" ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900">
                  {prediction.label.toLowerCase() === "road"
                    ? "✓ Road Detected"
                    : "✗ Not a Road"}
                </h4>
                <p className="text-sm mt-2 text-gray-700">
                  {prediction.label.toLowerCase() === "road"
                    ? "Our AI has confirmed this image contains a road. The image has been processed successfully."
                    : "Our AI could not identify a road in this image. Please ensure you're uploading an image of a road."}
                </p>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Classification</p>
                      <p className={`font-medium ${
                        prediction.label.toLowerCase() === "road"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}>
                        {prediction.label.toLowerCase() === "road" ? "Road" : "Not a Road"}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Saved to Database</p>
                      <p className="text-blue-600 font-medium">{prediction.saved ? "Yes" : "No"}</p>
                    </div>
                  </div>
                  
                  {prediction.label.toLowerCase() === "road" && (
                    <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-blue-800 text-sm">
                        <span className="font-medium">Next Steps:</span> You can now proceed to analyze this road for issues or save it for future reference.
                      </p>
                    </div>
                  )}
                  
                  {prediction.label !== "road" && (
                    <div className="mt-4 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <p className="text-amber-800 text-sm">
                        <span className="font-medium">Suggestion:</span> Try uploading a clearer image of a road surface.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}



{activeTab === "Dashboard" && (
  <div className="flex-1 p-6 bg-gray-100 animate-fadeIn overflow-y-auto min-h-screen">
    <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
    <p className="text-gray-700 mb-6">Welcome to the dashboard!</p>

    {/* Top Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2">Sanctioned Roads</h2>
            <p className="text-sm text-blue-100">Approved for construction</p>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-6">
          <span className="text-4xl font-bold">{roadStats.sanctioned}</span>
          <div className="mt-2 text-sm text-blue-100">
            <span className="bg-blue-700 bg-opacity-50 px-2 py-1 rounded-full">
              {notifications.length > 0 ? Math.round((roadStats.sanctioned / notifications.length) * 100) : 0}% of total
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2">Pending Roads</h2>
            <p className="text-sm text-purple-100">Awaiting approval</p>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-6">
          <span className="text-4xl font-bold">{roadStats.pending}</span>
          <div className="mt-2 text-sm text-purple-100">
            <span className="bg-purple-700 bg-opacity-50 px-2 py-1 rounded-full">
              {notifications.length > 0 ? Math.round((roadStats.pending / notifications.length) * 100) : 0}% of total
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2">Repaired Roads</h2>
            <p className="text-sm text-yellow-800">Completed repairs</p>
          </div>
          <div className="bg-white bg-opacity-30 p-3 rounded-lg">
            <span role="img" aria-label="repair" className="text-xl">🛠️</span>
          </div>
        </div>
        <div className="mt-6">
          <span className="text-4xl font-bold">{roadStats.repaired}</span>
          <div className="mt-2 text-sm text-yellow-800">
            <span className="bg-yellow-600 bg-opacity-30 px-2 py-1 rounded-full">
              {roadStats.sanctioned > 0 ? Math.round((roadStats.repaired / roadStats.sanctioned) * 100) : 0}% of sanctioned
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Camera & Chart Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Live Camera */}
      <div className="bg-white rounded-2xl p-5 shadow-md">
  <h2 className="text-xl font-bold mb-4">Live User Location</h2>
  <UserLocationMap />
</div>
           

      {/* Chart Instead of Analysis */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Road Status Overview</h2>
          <div className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full font-medium">
            Based on {notifications.length} notifications
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { 
                name: 'Status', 
                Sanctioned: roadStats.sanctioned, 
                Pending: roadStats.pending, 
                Repaired: roadStats.repaired,
                Rejected: notifications.filter(n => n.details && n.details.status === 'rejected').length
              }
            ]}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip 
              formatter={(value, name) => [`${value} roads`, name]}
              labelFormatter={() => 'Road Status'}
            />
            <Legend />
            <Bar dataKey="Sanctioned" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={40} />
            <Bar dataKey="Pending" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={40} />
            <Bar dataKey="Repaired" fill="#eab308" radius={[0, 4, 4, 0]} barSize={40} />
            <Bar dataKey="Rejected" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Approval Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {notifications.length > 0 
                ? Math.round((roadStats.sanctioned / notifications.length) * 100) 
                : 0}%
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Repair Rate</p>
            <p className="text-2xl font-bold text-yellow-600">
              {roadStats.sanctioned > 0 
                ? Math.round((roadStats.repaired / roadStats.sanctioned) * 100) 
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
     


{activeTab === "History" && (
  <div className="flex-1 p-6 bg-white animate-fadeIn overflow-y-auto">
    <h2 className="text-3xl font-bold mb-6">Upload History</h2>
    <p className="text-gray-700 mb-6">Here you can see all your uploaded images with their details.</p>
    
    <div className="mt-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedImages.length > 0 ? (
              savedImages.map((item, index) => (
                <div key={index} className="border rounded-lg overflow-hidden shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
                  <img 
                    src={`http://localhost:5000/${item.imagePath}`} 
                    alt={`Upload ${index}`} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-4 w-4 text-red-500 mr-1" />
                      <h3 className="font-semibold text-gray-800 truncate">Location</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 truncate">{item.address}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-xs text-gray-500">Latitude</p>
                        <p className="text-sm font-medium">{item.latitude}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Longitude</p>
                        <p className="text-sm font-medium">{item.longitude}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-3">
                      <Clock className="h-4 w-4 text-blue-500 mr-1" />
                      <p className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    
                    {item.reviewStatus && (
                      <div className={`mt-2 px-2 py-1 rounded text-xs font-medium inline-block
                        ${item.reviewStatus === 'approved' ? 'bg-green-100 text-green-800' : 
                          item.reviewStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                          item.reviewStatus === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {item.reviewStatus.charAt(0).toUpperCase() + item.reviewStatus.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <div className="bg-gray-50 rounded-lg p-8 inline-block">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No uploads yet</h3>
                  <p className="text-gray-500">Your uploaded images will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
)}


      {/* SAVED */}
      {activeTab === "Saved" && (
        <div className="bg-white p-6 rounded-xl shadow-lg animate-fadeIn overflow-y-auto w-full">
          <h2 className="text-2xl font-bold mb-6">Saved Images</h2>
          {savedImages.length === 0 ? (
            <p>No saved road images yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedImages.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 shadow-sm bg-gray-50">
                  <img src={`http://localhost:5000/uploads/${item.image}`} alt={`Saved ${index}`} className="w-full h-48 object-cover rounded-lg mb-3" />
                  <p><strong>Prediction:</strong> {item.prediction}</p>
                  <p><strong>Location:</strong> {item.address}</p>
                  <p><strong>Time:</strong> {new Date(item.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
