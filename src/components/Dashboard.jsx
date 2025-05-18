import { useEffect, useState, useRef } from "react";
import { FaHome, FaCamera, FaClock, FaSave, FaAddressCard, FaSign, FaSignOutAlt } from "react-icons/fa"; 
import { Bell, AlertTriangle, AlertCircle, CheckCircle, Clock, X, Camera, MapPin, FileText, Search, RefreshCw, PieChart as PieChartIcon } from "lucide-react";
import axios from "axios";
import UserLocationMap from "../components/UserLocationMap";  
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  PieChart,
  Pie,
  Cell,
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
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [manualAddressCoords, setManualAddressCoords] = useState(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Image & Prediction
  const [selectedFile, setSelectedFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Loading states
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Verify user authentication with the server
  const verifyAuthentication = async (userId) => {
    try {
      // First check locally if this is an admin user by ID prefix or stored value
      const isAdminByPrefix = userId.startsWith('admin_');
      const storedIsAdmin = localStorage.getItem('roadVisionIsAdmin') === 'true';
      
      // If it's an admin by prefix or stored value, don't continue with verification in user dashboard
      if (isAdminByPrefix || storedIsAdmin) {
        console.log("Admin user detected in Dashboard component verification");
        // Store this information but don't redirect - let the useEffect handle it
        return false;
      }
      
      // For non-admin users, verify with the server
      const response = await fetch('http://localhost:5000/api/verify-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      console.log("Authentication verification response:", data);
      
      if (response.ok && data.authenticated) {
        // Update user name if provided
        if (data.name && data.name !== userName) {
          setUserName(data.name);
          localStorage.setItem('roadVisionUserName', data.name);
        }
        
        // Store user type and admin status in localStorage for consistency
        if (data.userType) {
          localStorage.setItem('roadVisionUserType', data.userType);
        }
        
        // Update admin status
        localStorage.setItem('roadVisionIsAdmin', data.isAdmin ? 'true' : 'false');
        
        // If server says this is an admin user but they're on the user dashboard, let useEffect handle redirect
        if (data.isAdmin || data.userType === 'admin') {
          console.log("Server identified user as admin, will redirect in useEffect");
          return false;
        }
        
        return true; // Authentication successful for regular user
      } else {
        // Authentication failed, redirect to login
        console.log("Authentication failed:", data.message);
        localStorage.removeItem('roadVisionUserId');
        localStorage.removeItem('roadVisionUserName');
        localStorage.removeItem('roadVisionUserType');
        localStorage.removeItem('roadVisionIsAdmin');
        navigate('/');
        return false;
      }
    } catch (error) {
      console.error("Error verifying authentication:", error);
      // On error, we'll keep the user logged in but log the error
      return true;
    }
  };

  // Get user info from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('roadVisionUserId');
    const storedUserName = localStorage.getItem('roadVisionUserName');
    const storedUserType = localStorage.getItem('roadVisionUserType');
    const storedIsAdmin = localStorage.getItem('roadVisionIsAdmin');
    
    console.log("Dashboard component mounted with stored values:", {
      userId: storedUserId,
      userName: storedUserName,
      userType: storedUserType,
      isAdmin: storedIsAdmin
    });
    
    if (!storedUserId) {
      // If no user ID is found, redirect to login
      console.log("No user ID found, redirecting to login");
      navigate('/');
      return; // Stop execution to prevent setting state after redirect
    }
    
    // Set initial state from localStorage
    setUserId(storedUserId);
    if (storedUserName) {
      setUserName(storedUserName);
    }
    
    // Check if this is an admin user by stored value first, then by ID prefix as fallback
    const isAdmin = storedIsAdmin === 'true' || (storedUserType === 'admin') || storedUserId.startsWith('admin_');
    
    // If user is admin but on user dashboard, redirect to admin page
    if (isAdmin) {
      console.log("Admin user detected in Dashboard component, redirecting to admin page");
      // Add a small delay to prevent potential redirect loops
      setTimeout(() => {
        navigate('/admin');
      }, 100);
      return; // Stop execution to prevent setting state after redirect
    }
    
    // For regular users, verify with server
    verifyAuthentication(storedUserId);
    
    // Set up a periodic check but with less frequent interval to reduce server load
    const authCheckInterval = setInterval(() => {
      const currentUserId = localStorage.getItem('roadVisionUserId');
      const currentIsAdmin = localStorage.getItem('roadVisionIsAdmin');
      
      // If user ID is removed, redirect to login
      if (!currentUserId) {
        console.log("User ID no longer found, redirecting to login");
        navigate('/');
        return;
      }
      
      // Only verify non-admin users with the server
      if (currentIsAdmin !== 'true' && !currentUserId.startsWith('admin_')) {
        verifyAuthentication(currentUserId);
      }
      
    }, 60000); // Check every 60 seconds (reduced from 30s)
    
    // Clean up interval on component unmount
    return () => clearInterval(authCheckInterval);
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
    approved: 0,
    pending: 0,
    completed: 0,
    rejected: 0
  });
  
  // Historical data for trends
  const [historicalData, setHistoricalData] = useState([]);
  
  // We're only using the pie chart now
  // const [activeChartType, setActiveChartType] = useState('pie');

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
  
  // 🌎 Geocode manual address to coordinates
  const geocodeAddress = async (address) => {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }
    
    setIsGeocodingLoading(true);
    setError("");
    
    try {
      // Use Nominatim for geocoding (same service as reverse geocoding)
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        setManualAddressCoords({
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          address: address
        });
      } else {
        setError("Could not find coordinates for this address. Please try a different address.");
        setManualAddressCoords(null);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Failed to convert address to coordinates. Please try again.");
      setManualAddressCoords(null);
    } finally {
      setIsGeocodingLoading(false);
    }
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

    // Check location based on whether we're using manual address or current location
    if (useManualAddress) {
      if (!manualAddressCoords) {
        setError("Please enter and verify a valid address first by clicking the search button.");
        return;
      }
    } else if (!location) {
      setError("Current location not available. Please allow location access or toggle to 'Manual' to enter the address manually.");
      return;
    }
    
    if (!userId) {
      setError("User ID not available. Please log in again.");
      return;
    }

    // Use the appropriate location data based on user selection
    const locationData = useManualAddress ? manualAddressCoords : location;

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("latitude", locationData.lat);
    formData.append("longitude", locationData.lon);
    formData.append("address", locationData.address);
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
  
  // Ensure notification has a valid details structure
  const validateNotification = (notification) => {
    // Create a default details object if it doesn't exist
    if (!notification.details) {
      notification.details = {};
    }
    
    // Ensure required fields exist
    if (!notification.details.status) notification.details.status = 'pending';
    if (!notification.details.severity) notification.details.severity = 'low';
    if (!notification.details.address) notification.details.address = 'Unknown location';
    if (!notification.details.date) notification.details.date = new Date().toLocaleDateString();
    
    return notification;
  };

  // Function to add a new notification
  const addNotification = (notification) => {
    const newNotification = validateNotification({
      id: Date.now(),
      timestamp: Date.now(),
      read: false,
      ...notification
    });
    
    setNotifications(prev => {
      // Validate all existing notifications too
      const validatedPrev = prev.map(n => validateNotification(n));
      const updatedNotifications = [newNotification, ...validatedPrev];
      
      // Save to localStorage
      if (userId) {
        localStorage.setItem(`roadVisionNotifications_${userId}`, JSON.stringify(updatedNotifications));
      }
      return updatedNotifications;
    });
    
    // Show notification popup
    setShowNotification(true);
    // Auto-hide after 5 seconds
    setTimeout(() => setShowNotification(false), 5000);
  };
  
  // Load notifications from localStorage
  useEffect(() => {
    if (userId) {
      try {
        const storedNotifications = localStorage.getItem(`roadVisionNotifications_${userId}`);
        if (storedNotifications) {
          const parsedNotifications = JSON.parse(storedNotifications);
          // Validate all notifications
          const validatedNotifications = parsedNotifications.map(n => validateNotification(n));
          setNotifications(validatedNotifications);
          console.log("Loaded notifications from localStorage:", validatedNotifications);
        }
      } catch (error) {
        console.error("Error loading notifications from localStorage:", error);
        // If there's an error, clear the notifications in localStorage
        localStorage.removeItem(`roadVisionNotifications_${userId}`);
      }
    }
  }, [userId]);

  // WebSocket connection is now handled by Socket.IO in the effect below
  // This comment is kept to maintain code structure
  
  // Load saved notifications from localStorage on component mount - user specific
  useEffect(() => {
    if (userId) {
      const savedNotifications = localStorage.getItem(`roadVisionNotifications_${userId}`);
      if (savedNotifications) {
        try {
          const parsedNotifications = JSON.parse(savedNotifications);
          setNotifications(parsedNotifications);
          
          // Keep empty notifications array as is - no need to create demo data
          // This ensures new users start with zero notifications
        } catch (error) {
          console.error('Error parsing saved notifications:', error);
          // Create fallback notifications
          const fallbackNotifications = [];
          setNotifications(fallbackNotifications);
          localStorage.setItem(`roadVisionNotifications_${userId}`, JSON.stringify(fallbackNotifications));
        }
      } else {
        // If no notifications exist yet, initialize with an empty array
        const emptyNotifications = [];
        setNotifications(emptyNotifications);
        localStorage.setItem(`roadVisionNotifications_${userId}`, JSON.stringify(emptyNotifications));
      }
    }
  }, [userId]);

  // Save notifications to localStorage whenever they change and update road statistics - user specific
  useEffect(() => {
    if (userId) {
      // Always save notifications to localStorage, even if empty
      localStorage.setItem(`roadVisionNotifications_${userId}`, JSON.stringify(notifications));
      
      // Only update statistics if we have notifications and haven't already fetched from API
      if (notifications.length > 0 && !statsLoading) {
        // Calculate road statistics from notifications
        const approved = notifications.filter(n => 
          n.details && n.details.status === 'approved'
        ).length;
        
        const pending = notifications.filter(n => 
          n.details && (n.details.status === 'pending' || n.details.status === 'in-progress')
        ).length;
        
        const completed = notifications.filter(n => 
          n.details && n.details.action && n.details.action.toLowerCase().includes('repair') && 
          n.details.status === 'approved'
        ).length;
        
        const rejected = notifications.filter(n => 
          n.details && n.details.status === 'rejected'
        ).length;
        
        // Only update if we have at least one non-zero value to prevent resetting
        if (approved > 0 || pending > 0 || completed > 0 || rejected > 0) {
          setRoadStats({
            approved,
            pending,
            completed,
            rejected
          });
        }
      }
    }
  }, [notifications, userId, statsLoading]);
  
  // Generate historical data for trends
  const generateHistoricalData = (currentStats) => {
    // Create 7 days of historical data
    const days = 7;
    const data = [];
    
    // Get current date
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Format date as MM/DD
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      
      // Generate realistic trend data based on current stats
      // Earlier days have slightly lower values to show growth
      const factor = 0.7 + ((days - i) / days) * 0.5;
      
      data.push({
        date: formattedDate,
        Approved: Math.round(currentStats.approved * factor * (0.9 + Math.random() * 0.2)),
        Pending: Math.round(currentStats.pending * factor * (0.9 + Math.random() * 0.2)),
        Completed: Math.round(currentStats.completed * factor * (0.9 + Math.random() * 0.2)),
        Rejected: Math.round(currentStats.rejected * factor * (0.9 + Math.random() * 0.2)),
        Total: 0 // Will be calculated below
      });
    }
    
    // Calculate totals and cumulative values for area chart
    let cumulativeApproved = 0;
    let cumulativePending = 0;
    let cumulativeCompleted = 0;
    let cumulativeRejected = 0;
    
    data.forEach(day => {
      day.Total = day.Approved + day.Pending + day.Completed + day.Rejected;
      
      // Add cumulative values for area chart
      cumulativeApproved += day.Approved * 0.2; // Scale down for better visualization
      cumulativePending += day.Pending * 0.2;
      cumulativeCompleted += day.Completed * 0.2;
      cumulativeRejected += day.Rejected * 0.2;
      
      day.CumulativeApproved = Math.round(cumulativeApproved);
      day.CumulativePending = Math.round(cumulativePending);
      day.CumulativeCompleted = Math.round(cumulativeCompleted);
      day.CumulativeRejected = Math.round(cumulativeRejected);
    });
    
    return data;
  };

  // Function to fetch road statistics
  const fetchRoadStats = async () => {
    if (!userId) return;
    
    try {
      setStatsLoading(true);
      
      // Try to fetch from API first
      const response = await fetch(`http://localhost:5000/api/road-stats?userId=${userId}`);
      
      let newStats;
      
      if (response.ok) {
        const data = await response.json();
        // Only update if we have valid data with at least one non-zero value
        if (data && (data.approved > 0 || data.pending > 0 || data.completed > 0 || data.rejected > 0)) {
          newStats = data;
          setRoadStats(data);
        }
      } else {
        console.log('Using calculated stats from notifications');
        
        // If API fails and there are no notifications, use zeros for stats
        if (notifications.length === 0) {
          // Use zeros for new users with no notifications
          newStats = {
            approved: 0,
            pending: 0,
            completed: 0,
            rejected: 0
          };
          setRoadStats(newStats);
        } else {
          // Calculate stats from notifications
          const approved = notifications.filter(n => 
            n.details && n.details.status === 'approved'
          ).length;
          
          const pending = notifications.filter(n => 
            n.details && (n.details.status === 'pending' || n.details.status === 'in-progress')
          ).length;
          
          const completed = notifications.filter(n => 
            n.details && n.details.action && n.details.action.toLowerCase().includes('repair') && 
            n.details.status === 'approved'
          ).length;
          
          const rejected = notifications.filter(n => 
            n.details && n.details.status === 'rejected'
          ).length;
          
          // Only update if we have at least one non-zero value
          if (approved > 0 || pending > 0 || completed > 0 || rejected > 0) {
            newStats = {
              approved,
              pending,
              completed,
              rejected
            };
            setRoadStats(newStats);
          }
        }
      }
      
      // Generate historical data based on the new stats
      if (newStats) {
        const historicalData = generateHistoricalData(newStats);
        setHistoricalData(historicalData);
      }
    } catch (error) {
      console.error('Error fetching road statistics:', error);
      // Use zeros for fallback for new users
      setRoadStats(prevStats => {
        // Only set zeros if current stats are all zeros
        if (prevStats.approved === 0 && prevStats.pending === 0 && 
            prevStats.completed === 0 && prevStats.rejected === 0) {
          const newStats = {
            approved: 0,
            pending: 0,
            completed: 0,
            rejected: 0
          };
          
          // Generate historical data
          const historicalData = generateHistoricalData(newStats);
          setHistoricalData(historicalData);
          
          return newStats;
        }
        return prevStats;
      });
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Fetch road statistics from API
  useEffect(() => {
    if (!userId) return;
    
    fetchRoadStats();
    
    // Set up interval to refresh stats every 30 seconds
    const intervalId = setInterval(fetchRoadStats, 30000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

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
          latestNotification.details?.status === 'approved' ? 'bg-gradient-to-r from-green-600 to-green-500' :
          latestNotification.details?.status === 'rejected' ? 'bg-gradient-to-r from-red-600 to-red-500' :
          latestNotification.details?.status === 'in-progress' ? 'bg-gradient-to-r from-green-600 to-green-500' :
          'bg-gradient-to-r from-gray-700 to-gray-600'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white bg-opacity-20 p-1.5 rounded-full">
                {latestNotification.details?.status === 'approved' ? 
                  <CheckCircle className="h-4 w-4" /> : 
                  latestNotification.details?.status === 'rejected' ? 
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
          
          <div className="mt-3 text-sm text-gray-900 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 font-semibold">Status</p>
                <p className={`font-medium ${
                  latestNotification.details?.status === 'approved' ? 'text-green-600' :
                  latestNotification.details?.status === 'rejected' ? 'text-red-600' :
                  latestNotification.details?.status === 'in-progress' ? 'text-green-600' :
                  'text-gray-900'
                }`}>
                  {latestNotification.details?.status ? 
                    (latestNotification.details.status.charAt(0).toUpperCase() + latestNotification.details.status.slice(1)) : 
                    'Pending'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Severity</p>
                <p className={`font-medium ${
                  latestNotification.details?.severity === 'severe' ? 'text-red-600' :
                  latestNotification.details?.severity === 'high' ? 'text-orange-600' :
                  latestNotification.details?.severity === 'moderate' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {latestNotification.details?.severity ? 
                    (latestNotification.details.severity.charAt(0).toUpperCase() + latestNotification.details.severity.slice(1)) : 
                    'Unknown'}
                </p>
              </div>
            </div>
            
            {latestNotification.details?.notes && (
              <div className="pt-1">
                <p className="text-xs text-gray-500 font-semibold">Notes</p>
                <p className="text-gray-900">{latestNotification.details.notes}</p>
              </div>
            )}
            
            {latestNotification.details?.action && (
              <div className="pt-1">
                <p className="text-xs text-gray-500 font-semibold">Recommended Action</p>
                <p className="text-gray-900">{latestNotification.details.action}</p>
              </div>
            )}
            
            <div className="pt-1">
              <p className="text-xs text-gray-500 font-semibold">Location</p>
              <p className="text-gray-900 truncate">{latestNotification.details?.address || 'Unknown location'}</p>
            </div>
            
            <div className="pt-1">
              <p className="text-xs text-gray-500 font-semibold">Review Date</p>
              <p className="text-gray-900">{latestNotification.details?.date || new Date().toLocaleDateString()}</p>
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
              className="px-3 py-1.5 text-green-600 hover:text-green-800 text-sm font-medium"
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
                    className={`p-4 rounded-lg border ${notification.read ? 'bg-white border-gray-200' : 'bg-green-50 border-green-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          notification.details?.status === 'approved' ? 'bg-green-100 text-green-600' :
                          notification.details?.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          notification.details?.status === 'in-progress' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {notification.details?.status === 'approved' ? 
                            <CheckCircle className="h-5 w-5" /> : 
                            notification.details?.status === 'rejected' ? 
                            <AlertTriangle className="h-5 w-5" /> : 
                            <Clock className="h-5 w-5" />
                          }
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-900 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-700 mt-1 font-medium">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                          {notification.details?.address && (
                            <p className="text-xs text-gray-700 mt-1">
                              <span className="font-semibold">Location:</span> {notification.details.address}
                            </p>
                          )}
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="bg-green-500 w-2 h-2 rounded-full"></div>
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
                        className="text-sm text-green-600 hover:text-green-800"
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
          className="fixed top-4 right-4 z-40 bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center"
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
          <div className=" ">
        
          </div>
          {userName && (
             <div>
                <span className="font-bold">{   }</span>
            </div>
          )}
        </div>
        
        <ul className="space-y-2">
          {[
            { name: "Dashboard", icon: <FaHome className="text-green-600" /> },
            { name: "Camera", icon: <FaCamera className="text-green-500" /> },
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
                  ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md" 
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
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">Help improve road safety by reporting issues in your area.</p>
          </div>
        </div>
      </div>

      {activeTab === "Camera" && (
  <div className="flex-1 bg-gradient-to-br from-gray-50 to-green-50 p-8 overflow-y-auto text-gray-800 transition-all duration-300">
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
          <div className="bg-green-600 text-white p-2 rounded-lg">
            <Camera className="h-6 w-6" />
          </div>
          Road Issue Detection
        </h2>
        
        <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg text-green-800">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-4 bg-gradient-to-r from-green-600 to-green-500 text-white">
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
                    : "bg-green-600 hover:bg-green-700 text-white"
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
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <MapPin className="h-5 w-5 text-red-500" />
              Location Information
            </h4>
            
            {/* Toggle between current location and manual address */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!useManualAddress ? 'font-semibold text-green-600' : 'text-gray-500'}`}>
                Current
              </span>
              <button 
                onClick={() => {
                  setUseManualAddress(!useManualAddress);
                  // Reset error when toggling
                  setError("");
                  // Reset manual address fields when switching back to current location
                  if (useManualAddress) {
                    setManualAddress("");
                    setManualAddressCoords(null);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${useManualAddress ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useManualAddress ? 'translate-x-6' : 'translate-x-1'}`} 
                />
              </button>
              <span className={`text-sm ${useManualAddress ? 'font-semibold text-green-600' : 'text-gray-500'}`}>
                Manual
              </span>
            </div>
          </div>
          
          {!useManualAddress ? (
            // Current location section
            loading ? (
              <div className="flex items-center gap-3 text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
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
            )
          ) : (
            // Manual address section
            <div className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="manual-address" className="text-sm text-gray-600 mb-1">Enter Address</label>
                <div className="flex gap-2">
                  <input
                    id="manual-address"
                    type="text"
                    value={manualAddress}
                    onChange={(e) => {
                      setManualAddress(e.target.value);
                      // Clear error when user starts typing a new address
                      if (error) setError("");
                    }}
                    placeholder="Enter the location where the image was taken"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => geocodeAddress(manualAddress)}
                    disabled={isGeocodingLoading || !manualAddress.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isGeocodingLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              {manualAddressCoords && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Verified Address</p>
                    <p className="text-gray-800">{manualAddressCoords.address}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Latitude</p>
                      <p className="text-gray-800 font-medium">{manualAddressCoords.lat}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Longitude</p>
                      <p className="text-gray-800 font-medium">{manualAddressCoords.lon}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <FileText className="h-5 w-5 text-green-500" />
            Upload Road Image
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors flex flex-col justify-center items-center h-64">
              <input
                type="file"
                id="file-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-green-600" />
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
                    ? "Road Detected"
                    : "Not a Road"}
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
                     </div>
                  </div>
                  
                  {prediction.label.toLowerCase() === "road" && (
                    <div className="mt-4 bg-green-50 p-3 rounded-lg border border-green-100">
                      <p className="text-green-800 text-sm">
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
  <div className="flex-1 bg-gradient-to-br from-gray-50 to-slate-50 p-8 animate-fadeIn overflow-y-auto min-h-screen">
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-3 rounded-xl shadow-md">
            <FaHome className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Road Monitoring Dashboard</h2>
        </div>
        <p className="text-gray-600 pl-1">
          Welcome back, <span className="font-semibold text-indigo-700">{userName}</span>! 
          Here's your real-time road condition monitoring overview.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-700 flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <button 
          onClick={fetchRoadStats}
          className="bg-indigo-600 p-2 rounded-xl shadow-sm hover:shadow-md transition-all text-white flex items-center gap-2 px-4"
          disabled={statsLoading}
        >
          <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>
    </div>

    {/* Top Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-emerald-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Approved Reports</h2>
            <p className="text-sm text-gray-500">Verified road issues</p>
          </div>
          <div className="bg-emerald-100 p-3 rounded-full">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
        <div className="mt-6">
          {statsLoading ? (
            <div className="h-10 w-16 bg-emerald-100 animate-pulse rounded-md"></div>
          ) : (
            <span className="text-4xl font-bold text-emerald-600">{roadStats.approved}</span>
          )}
          <div className="mt-2 text-sm">
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
              {notifications.length > 0 ? Math.round((roadStats.approved / notifications.length) * 100) : 0}% of total
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-amber-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Pending Review</h2>
            <p className="text-sm text-gray-500">Awaiting assessment</p>
          </div>
          <div className="bg-amber-100 p-3 rounded-full">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <div className="mt-6">
          {statsLoading ? (
            <div className="h-10 w-16 bg-amber-100 animate-pulse rounded-md"></div>
          ) : (
            <span className="text-4xl font-bold text-amber-600">{roadStats.pending}</span>
          )}
          <div className="mt-2 text-sm">
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
              {notifications.length > 0 ? Math.round((roadStats.pending / notifications.length) * 100) : 0}% of total
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-blue-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Completed Repairs</h2>
            <p className="text-sm text-gray-500">Fixed road issues</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-6">
          {statsLoading ? (
            <div className="h-10 w-16 bg-blue-100 animate-pulse rounded-md"></div>
          ) : (
            <span className="text-4xl font-bold text-blue-600">{roadStats.completed}</span>
          )}
          <div className="mt-2 text-sm">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              {roadStats.approved > 0 ? Math.round((roadStats.completed / roadStats.approved) * 100) : 0}% completion rate
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-rose-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Rejected Reports</h2>
            <p className="text-sm text-gray-500">Not requiring action</p>
          </div>
          <div className="bg-rose-100 p-3 rounded-full">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
        </div>
        <div className="mt-6">
          {statsLoading ? (
            <div className="h-10 w-16 bg-rose-100 animate-pulse rounded-md"></div>
          ) : (
            <span className="text-4xl font-bold text-rose-600">{roadStats.rejected}</span>
          )}
          <div className="mt-2 text-sm">
            <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full font-medium">
              {(roadStats.approved + roadStats.rejected) > 0 ? Math.round((roadStats.rejected / (roadStats.approved + roadStats.rejected)) * 100) : 0}% rejection rate
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
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <PieChartIcon className="h-5 w-5 text-indigo-600" />
            </div>
            Road Status Analytics
            <button 
              onClick={fetchRoadStats}
              className="bg-indigo-50 p-1 rounded-full hover:bg-indigo-100 transition-colors"
              title="Refresh data"
              disabled={statsLoading}
            >
              <RefreshCw className={`h-4 w-4 text-indigo-600 ${statsLoading ? 'animate-spin' : ''}`} />
            </button>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-medium">
              Based on {notifications.length} notifications
            </div>
            <div className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-medium text-gray-800">Road Reports Distribution</h3>
          </div>
          <p className="text-sm text-gray-500">
            Proportional breakdown of road reports by status category.
          </p>
        </div>
        
        {statsLoading ? (
          <div className="h-[300px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">Loading statistics...</p>
              <p className="text-xs text-gray-400">Fetching the latest road report data</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Approved', value: roadStats.approved, color: '#10b981' },
                  { name: 'Pending', value: roadStats.pending, color: '#f59e0b' },
                  { name: 'Completed', value: roadStats.completed, color: '#3b82f6' },
                  { name: 'Rejected', value: roadStats.rejected, color: '#f43f5e' },
                ]}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={130}
                innerRadius={70}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                paddingAngle={3}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {[
                  { name: 'Approved', value: roadStats.approved, color: '#10b981' },
                  { name: 'Pending', value: roadStats.pending, color: '#f59e0b' },
                  { name: 'Completed', value: roadStats.completed, color: '#3b82f6' },
                  { name: 'Rejected', value: roadStats.rejected, color: '#f43f5e' },
                ].map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="#ffffff" 
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} reports`, name]} 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '8px',
                  padding: '10px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0'
                }}
                itemStyle={{ color: '#4b5563' }}
                labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={10}
                layout="horizontal"
                wrapperStyle={{
                  paddingTop: '15px',
                  fontSize: '14px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        
        <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-medium text-gray-800">Report Summary</h3>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-700">
                <span className="font-medium">{roadStats.approved}</span> Approved
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-700">
                <span className="font-medium">{roadStats.pending}</span> Pending
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-700">
                <span className="font-medium">{roadStats.completed}</span> Completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-rose-500"></div>
              <span className="text-sm text-gray-700">
                <span className="font-medium">{roadStats.rejected}</span> Rejected
              </span>
            </div>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-700">
                Total: <span className="font-medium">{roadStats.approved + roadStats.pending + roadStats.completed + roadStats.rejected}</span> Reports
              </span>
            </div>
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
                          item.reviewStatus === 'in-progress' ? 'bg-green-100 text-green-800' : 
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
