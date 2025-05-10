import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL, getSocketUrl } from "../utils/apiConfig";
import UserLocationMap from "../components/UserLocationMap";
import Sidebar from "../components/Sidebar";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from "recharts";
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Activity,
  FileText,
  BarChart as BarChartIcon
} from "lucide-react";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  
  // Get user info from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('roadVisionUserId');
    const storedUserName = localStorage.getItem('roadVisionUserName');
    const storedUserType = localStorage.getItem('roadVisionUserType');
    const storedIsAdmin = localStorage.getItem('roadVisionIsAdmin');
    
    console.log("Admin component mounted with stored values:", {
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
    
    // Set user ID from localStorage
    setUserId(storedUserId);
    
    // Set username if available
    if (storedUserName) {
      setUserName(storedUserName);
    }
    
    // Check if user is admin by multiple indicators
    const isAdmin = storedIsAdmin === 'true' || storedUserType === 'admin' || storedUserId.startsWith('admin_');
    
    // If not an admin user, redirect to user dashboard
    if (!isAdmin) {
      console.log("Non-admin user detected in Admin component, redirecting to user dashboard");
      // Add a small delay to prevent potential redirect loops
      setTimeout(() => {
        navigate('/user');
      }, 100);
      return; // Stop execution to prevent setting state after redirect
    }
    
    // If we get here, the user is an admin and should stay on this page
    console.log("Admin user confirmed in Admin component");
    
    // Ensure localStorage has consistent admin values
    if (storedUserType !== 'admin') {
      localStorage.setItem('roadVisionUserType', 'admin');
    }
    if (storedIsAdmin !== 'true') {
      localStorage.setItem('roadVisionIsAdmin', 'true');
    }
    
    // Verify with server if needed (for non-prefix admin users)
    if (!storedUserId.startsWith('admin_')) {
      fetch('https://inspectify-backend.onrender.com/api/verify-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: storedUserId })
      })
      .then(response => {
        if (response.ok) {
          return response.json().then(data => {
            if (data.authenticated) {
              console.log("Server verified admin status:", data);
              // Update localStorage with server response
              if (data.name) {
                setUserName(data.name);
                localStorage.setItem('roadVisionUserName', data.name);
              }
            }
          });
        }
      })
      .catch(error => {
        console.error("Error verifying admin authentication:", error);
      });
    }
  }, [navigate]);
  
  // Socket.IO connection for real-time notifications
  useEffect(() => {
    // Only connect to socket.io if we have a userId and it's an admin
    if (!userId || !userId.startsWith('admin_')) return;
    
    // Import socket.io-client dynamically
    import('socket.io-client').then(({ io }) => {
      const socketUrl = getSocketUrl();
      console.log('Connecting to socket server at:', socketUrl);
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });
      
      socket.on('connect', () => {
        console.log('Socket.IO connected in Admin');
        // Authenticate with the server using userId
        socket.emit('authenticate', userId);
      });
      
      // Handle authentication response
      socket.on('auth_success', (data) => {
        console.log('Socket authentication successful:', data.message);
        // No redirection needed here - we're already on the admin page
      });
      
      socket.on('auth_error', (data) => {
        console.error('Socket authentication error:', data.message);
        // Don't redirect on auth error, just log it
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error in Admin:', error);
      });
      
      return () => {
        socket.disconnect();
      };
    }).catch(err => {
      console.error('Failed to load socket.io-client in Admin:', err);
    });
  }, [userId]); // Re-connect if userId changes

  const [reportStats, setReportStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0
  });
  const [weeklyReportData, setWeeklyReportData] = useState([]);
  const [damageTypeData, setDamageTypeData] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState({
    stats: false,
    weekly: false,
    damage: false,
    severity: false,
    recent: false
  });
  
  // Fetch user-specific report statistics
  useEffect(() => {
    const fetchReportStats = async () => {
      if (!userId) return;
      
      setLoading(prev => ({ ...prev, stats: true }));
      try {
        // Only fetch stats for the current user if not an admin
        const isAdmin = userId.startsWith('admin_');
        const url = isAdmin 
          ? "https://inspectify-backend.onrender.com/api/report-stats" // Admin sees all stats
          : `https://inspectify-backend.onrender.com/api/report-stats?userId=${userId}`; // Regular users see only their stats
        
        const response = await fetch(url);
        if (response.ok) {
          const stats = await response.json();
          setReportStats(stats);
        } else {
          // If API not available, use mock data
          console.warn("API not available, using mock data for report stats");
          const mockStats = isAdmin 
            ? { total: 120, pending: 35, reviewed: 85 } 
            : { total: 8, pending: 3, reviewed: 5 };
          setReportStats(mockStats);
        }
      } catch (error) {
        console.error("Error fetching report stats:", error);
        // Fallback to mock data
        setReportStats({ total: 8, pending: 3, reviewed: 5 });
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };
    
    const fetchWeeklyReports = async () => {
      if (!userId) return;
      
      setLoading(prev => ({ ...prev, weekly: true }));
      try {
        const isAdmin = userId.startsWith('admin_');
        const url = isAdmin 
          ? "https://inspectify-backend.onrender.com/api/weekly-reports" 
          : `https://inspectify-backend.onrender.com/api/weekly-reports?userId=${userId}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setWeeklyReportData(data);
        } else {
          console.warn("API not available, using mock data for weekly reports");
          setWeeklyReportData([
            { name: 'Mon', reports: 4 },
            { name: 'Tue', reports: 7 },
            { name: 'Wed', reports: 5 },
            { name: 'Thu', reports: 8 },
            { name: 'Fri', reports: 12 },
            { name: 'Sat', reports: 6 },
            { name: 'Sun', reports: 3 },
          ]);
        }
      } catch (error) {
        console.error("Error fetching weekly reports:", error);
        setWeeklyReportData([
          { name: 'Mon', reports: 4 },
          { name: 'Tue', reports: 7 },
          { name: 'Wed', reports: 5 },
          { name: 'Thu', reports: 8 },
          { name: 'Fri', reports: 12 },
          { name: 'Sat', reports: 6 },
          { name: 'Sun', reports: 3 },
        ]);
      } finally {
        setLoading(prev => ({ ...prev, weekly: false }));
      }
    };
    
    const fetchDamageDistribution = async () => {
      if (!userId) return;
      
      setLoading(prev => ({ ...prev, damage: true }));
      try {
        const isAdmin = userId.startsWith('admin_');
        const url = isAdmin 
          ? "https://inspectify-backend.onrender.com/api/damage-distribution" 
          : `https://inspectify-backend.onrender.com/api/damage-distribution?userId=${userId}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setDamageTypeData(data);
        } else {
          console.warn("API not available, using mock data for damage distribution");
          setDamageTypeData([
            { name: 'Potholes', value: 35 },
            { name: 'Cracks', value: 25 },
            { name: 'Erosion', value: 15 },
            { name: 'Debris', value: 10 },
            { name: 'Other', value: 15 },
          ]);
        }
      } catch (error) {
        console.error("Error fetching damage distribution:", error);
        setDamageTypeData([
          { name: 'Potholes', value: 35 },
          { name: 'Cracks', value: 25 },
          { name: 'Erosion', value: 15 },
          { name: 'Debris', value: 10 },
          { name: 'Other', value: 15 },
        ]);
      } finally {
        setLoading(prev => ({ ...prev, damage: false }));
      }
    };
    
    const fetchSeverityBreakdown = async () => {
      if (!userId) return;
      
      setLoading(prev => ({ ...prev, severity: true }));
      try {
        const isAdmin = userId.startsWith('admin_');
        const url = isAdmin 
          ? "https://inspectify-backend.onrender.com/api/severity-breakdown" 
          : `https://inspectify-backend.onrender.com/api/severity-breakdown?userId=${userId}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setSeverityData(data);
        } else {
          console.warn("API not available, using mock data for severity breakdown");
          setSeverityData([
            { name: 'High', value: 20, color: '#ef4444' },
            { name: 'Moderate', value: 45, color: '#f59e0b' },
            { name: 'Low', value: 35, color: '#10b981' },
          ]);
        }
      } catch (error) {
        console.error("Error fetching severity breakdown:", error);
        setSeverityData([
          { name: 'High', value: 20, color: '#ef4444' },
          { name: 'Moderate', value: 45, color: '#f59e0b' },
          { name: 'Low', value: 35, color: '#10b981' },
        ]);
      } finally {
        setLoading(prev => ({ ...prev, severity: false }));
      }
    };
    
    const fetchRecentReports = async () => {
      if (!userId) return;
      
      setLoading(prev => ({ ...prev, recent: true }));
      try {
        const isAdmin = userId.startsWith('admin_');
        const url = isAdmin 
          ? "https://inspectify-backend.onrender.com/api/recent-reports?limit=4" 
          : `https://inspectify-backend.onrender.com/api/recent-reports?userId=${userId}&limit=4`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setRecentReports(data);
        } else {
          console.warn("API not available, using mock data for recent reports");
          setRecentReports([
            { id: 1, location: '123 Main St', type: 'Pothole', severity: 'high', date: '2023-06-15', status: 'pending' },
            { id: 2, location: '456 Oak Ave', type: 'Crack', severity: 'moderate', date: '2023-06-14', status: 'approved' },
            { id: 3, location: '789 Pine Rd', type: 'Erosion', severity: 'low', date: '2023-06-13', status: 'approved' },
            { id: 4, location: '321 Elm St', type: 'Debris', severity: 'moderate', date: '2023-06-12', status: 'pending' },
          ]);
        }
      } catch (error) {
        console.error("Error fetching recent reports:", error);
        setRecentReports([
          { id: 1, location: '123 Main St', type: 'Pothole', severity: 'high', date: '2023-06-15', status: 'pending' },
          { id: 2, location: '456 Oak Ave', type: 'Crack', severity: 'moderate', date: '2023-06-14', status: 'approved' },
          { id: 3, location: '789 Pine Rd', type: 'Erosion', severity: 'low', date: '2023-06-13', status: 'approved' },
          { id: 4, location: '321 Elm St', type: 'Debris', severity: 'moderate', date: '2023-06-12', status: 'pending' },
        ]);
      } finally {
        setLoading(prev => ({ ...prev, recent: false }));
      }
    };
    
    // Fetch all data when userId changes
    fetchReportStats();
    fetchWeeklyReports();
    fetchDamageDistribution();
    fetchSeverityBreakdown();
    fetchRecentReports();
  }, [userId]);

  const radialData = [
    { name: "Reviewed", value: reportStats.reviewed, fill: "#3b82f6" },
    { name: "Pending", value: reportStats.pending, fill: "#facc15" },
  ];

  // Tab change is now handled by the Sidebar component

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar Component */}
      <Sidebar activeTab={activeTab} userName={userName} userId={userId} />

      {/* Main Content - with left margin to account for fixed sidebar */}
      <div className="flex-1 px-8 py-8 overflow-auto ml-64 bg-gray-50">
        {/* Dashboard View */}
        {activeTab === "Dashboard" && (
          <>
            {/* Modern Header with welcome message */}
            <div className="mb-10 bg-gradient-to-r from-green-600 to-green-800 rounded-2xl shadow-lg p-12 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <LayoutDashboard className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                  </div>
                  <p className="text-blue-100 max-w-2xl">
                    Welcome back, <span className="font-medium text-white">{userName || "Admin"}</span>. 
                    Here's your real-time overview of road condition reports and system analytics.
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="bg-blue-500 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold">
                    {userName ? userName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{userName || "Admin User"}</p>
                    <p className="text-xs text-blue-200">Administrator</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-200">Today's Date</p>
                  <p className="text-lg font-medium">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-200">Last Login</p>
                  <p className="text-lg font-medium">Today, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-200">System Status</p>
                  <p className="text-lg font-medium flex items-center">
                    <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                    Operational
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-200">Data Updated</p>
                  <p className="text-lg font-medium">Just Now</p>
                </div>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Reports</h3>
                    {loading.stats ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-4xl font-bold text-gray-800 mt-2">{reportStats.total}</p>
                    )}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-sm text-green-600 flex items-center font-medium">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>{reportStats.total > 0 ? `${Math.round(reportStats.reviewed / reportStats.total * 100)}% reviewed` : 'No reports yet'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-xl shadow-sm">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pending Review</h3>
                    {loading.stats ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-4xl font-bold text-gray-800 mt-2">{reportStats.pending}</p>
                    )}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-sm text-yellow-600 flex items-center font-medium">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Awaiting action</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 rounded-xl shadow-sm">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Reviewed</h3>
                    {loading.stats ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-4xl font-bold text-gray-800 mt-2">{reportStats.reviewed}</p>
                    )}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-sm text-blue-600 flex items-center font-medium">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Processed reports</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-4 rounded-xl shadow-sm">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Active Users</h3>
                    <p className="text-4xl font-bold text-gray-800 mt-2">
                      {userId && userId.startsWith('admin_') ? '24' : '1'}
                    </p>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-sm text-purple-600 flex items-center font-medium">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>{userId && userId.startsWith('admin_') ? '+8% from last week' : 'Currently active'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-xl shadow-sm">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Weekly Reports Chart */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Weekly Report Activity
                    </h2>
                    <p className="text-sm text-gray-500">Reports submitted over the past week</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    This Week
                  </div>
                </div>
                <div className="h-[320px]">
                  {loading.weekly ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="h-40 w-full bg-gray-200 rounded"></div>
                        <div className="mt-4 h-4 w-3/4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ) : weeklyReportData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyReportData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          width={30}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: 'none', 
                            borderRadius: '8px', 
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                          }}
                          itemStyle={{ color: '#3b82f6' }}
                          labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="reports" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorReports)" 
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center bg-blue-50 p-8 rounded-xl">
                        <Activity className="h-12 w-12 text-blue-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No weekly data available</p>
                        <p className="text-gray-500 text-sm mt-1">Check back later for updates</p>
                      </div>
                    </div>
                  )}
                </div>
                {weeklyReportData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                    <div className="text-gray-500">
                      <span className="font-medium text-gray-700">Total:</span> {weeklyReportData.reduce((sum, item) => sum + item.reports, 0)} reports
                    </div>
                    <div className="text-blue-600 font-medium cursor-pointer hover:underline">
                      View Details →
                    </div>
                  </div>
                )}
              </div>

              {/* Damage Type Distribution */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                      <BarChartIcon className="h-5 w-5 text-green-600" />
                      Damage Type Distribution
                    </h2>
                    <p className="text-sm text-gray-500">Breakdown of reported road damage types</p>
                  </div>
                  <div className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    All Time
                  </div>
                </div>
                <div className="h-[320px]">
                  {loading.damage ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="h-40 w-40 bg-gray-200 rounded-full"></div>
                        <div className="mt-4 h-4 w-3/4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ) : damageTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={damageTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={110}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          paddingAngle={2}
                          label={({ name, percent }) => 
                            percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                          }
                          labelStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        >
                          {damageTypeData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} 
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: 'none', 
                            borderRadius: '8px', 
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                          }}
                          itemStyle={{ fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center bg-green-50 p-8 rounded-xl">
                        <BarChartIcon className="h-12 w-12 text-green-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No damage data available</p>
                        <p className="text-gray-500 text-sm mt-1">Submit reports to see distribution</p>
                      </div>
                    </div>
                  )}
                </div>
                {damageTypeData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                    <div className="text-gray-500">
                      <span className="font-medium text-gray-700">Most common:</span> {damageTypeData.sort((a, b) => b.value - a.value)[0]?.name}
                    </div>
                    <div className="text-green-600 font-medium cursor-pointer hover:underline">
                      View Details →
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Severity Distribution */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Severity Breakdown
                  </h2>
                  <p className="text-sm text-gray-500">Distribution of report severity levels</p>
                </div>
                <div className="h-[250px] mt-4">
                  {loading.severity ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="animate-pulse flex flex-col items-center w-full">
                        <div className="h-6 w-full bg-gray-200 rounded mb-2"></div>
                        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ) : severityData.length > 0 && severityData.some(item => item.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={severityData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                          type="number" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }}
                          width={80}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: 'none', 
                            borderRadius: '8px', 
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                          }}
                          formatter={(value) => [`${value}%`, 'Percentage']}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={30}>
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center bg-yellow-50 p-8 rounded-xl">
                        <AlertTriangle className="h-12 w-12 text-yellow-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No severity data available</p>
                        <p className="text-gray-500 text-sm mt-1">Submit reports to see breakdown</p>
                      </div>
                    </div>
                  )}
                </div>
                {severityData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-700">Highest:</span> {severityData.sort((a, b) => b.value - a.value)[0]?.name}
                      </div>
                      <div className="text-yellow-600 font-medium cursor-pointer hover:underline text-sm">
                        View Details →
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Reports */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600"></div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
                      <Clock className="h-5 w-5 text-indigo-600" />
                      Recent Reports
                    </h2>
                    <p className="text-sm text-gray-500">Latest road condition reports submitted</p>
                  </div>
                  <button 
                    onClick={() => navigate('/report')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    View All
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
                {loading.recent ? (
                  <div className="animate-pulse">
                    <div className="h-10 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="grid grid-cols-6 gap-4">
                          <div className="h-6 bg-gray-200 rounded col-span-1"></div>
                          <div className="h-6 bg-gray-200 rounded col-span-2"></div>
                          <div className="h-6 bg-gray-200 rounded col-span-1"></div>
                          <div className="h-6 bg-gray-200 rounded col-span-1"></div>
                          <div className="h-6 bg-gray-200 rounded col-span-1"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : recentReports.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Severity</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentReports.map((report, index) => (
                          <tr key={report.id} className={`hover:bg-indigo-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">#{report.id.substring(0, 6)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1.5 flex-shrink-0" />
                              {report.location}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{report.type}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full border ${
                                report.severity === 'high' || report.severity === 'severe' 
                                  ? 'bg-red-100 text-red-800 border-red-200' 
                                  : report.severity === 'moderate' 
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                                    : 'bg-green-100 text-green-800 border-green-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  report.severity === 'high' || report.severity === 'severe'
                                    ? 'bg-red-500'
                                    : report.severity === 'moderate'
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}></span>
                                {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{report.date}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full border ${
                                report.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                                  : report.status === 'rejected' 
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : report.status === 'in-progress' 
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-green-100 text-green-800 border-green-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  report.status === 'pending'
                                    ? 'bg-yellow-500'
                                    : report.status === 'rejected'
                                      ? 'bg-red-500'
                                      : report.status === 'in-progress'
                                        ? 'bg-blue-500'
                                        : 'bg-green-500'
                                }`}></span>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Showing {recentReports.length} of {reportStats.total} reports
                      </div>
                      <button 
                        onClick={() => navigate('/report')}
                        className="text-indigo-600 font-medium text-sm hover:underline flex items-center"
                      >
                        See all reports
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-indigo-50 p-8 rounded-xl inline-block">
                      <FileText className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-2">No reports available</p>
                      <p className="text-gray-500 text-sm mb-4">Reports will appear here once they are submitted</p>
                      <button 
                        onClick={() => navigate('/report')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Create Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Live Map View */}
        {activeTab === "Map" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Live Map - Your Current Location
              </h2>
              <div className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded">
                Real-time
              </div>
            </div>
            <UserLocationMap />
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
