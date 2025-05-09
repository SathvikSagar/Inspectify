import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
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
      fetch('http://localhost:5000/api/verify-auth', {
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
      const socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
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
          ? "http://localhost:5000/api/report-stats" // Admin sees all stats
          : `http://localhost:5000/api/report-stats?userId=${userId}`; // Regular users see only their stats
        
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
          ? "http://localhost:5000/api/weekly-reports" 
          : `http://localhost:5000/api/weekly-reports?userId=${userId}`;
        
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
          ? "http://localhost:5000/api/damage-distribution" 
          : `http://localhost:5000/api/damage-distribution?userId=${userId}`;
        
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
          ? "http://localhost:5000/api/severity-breakdown" 
          : `http://localhost:5000/api/severity-breakdown?userId=${userId}`;
        
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
          ? "http://localhost:5000/api/recent-reports?limit=4" 
          : `http://localhost:5000/api/recent-reports?userId=${userId}&limit=4`;
        
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
      <div className="flex-1 px-8 py-8 overflow-auto ml-64">
        {/* Dashboard View */}
        {activeTab === "Dashboard" && (
          <>
            {/* Header with welcome message */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-green-600" />
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, <span className="font-medium">{userName || "Admin"}</span>. Here's an overview of road condition reports.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium">Total Reports</h3>
                    {loading.stats ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-800 mt-1">{reportStats.total}</p>
                    )}
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>{reportStats.total > 0 ? `${Math.round(reportStats.reviewed / reportStats.total * 100)}% reviewed` : 'No reports yet'}</span>
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium">Pending Review</h3>
                    {loading.stats ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-3xl font-bold text-yellow-600 mt-1">{reportStats.pending}</p>
                    )}
                    <p className="text-xs text-yellow-600 mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Awaiting action</span>
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium">Reviewed</h3>
                    {loading.stats ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-3xl font-bold text-blue-600 mt-1">{reportStats.reviewed}</p>
                    )}
                    <p className="text-xs text-blue-600 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>Processed reports</span>
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {userId && userId.startsWith('admin_') ? '24' : '1'}
                    </p>
                    <p className="text-xs text-purple-600 mt-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>{userId && userId.startsWith('admin_') ? '+8% from last week' : 'Currently active'}</span>
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Weekly Reports Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Weekly Report Activity
                  </h2>
                  <div className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded">
                    This Week
                  </div>
                </div>
                <div className="h-[300px]">
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
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="reports" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReports)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No weekly data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Damage Type Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-green-600" />
                    Damage Type Distribution
                  </h2>
                  <div className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded">
                    All Time
                  </div>
                </div>
                <div className="h-[300px]">
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
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => 
                            percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                          }
                        >
                          {damageTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center">
                        <BarChartIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No damage data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Severity Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Severity Breakdown
                </h2>
                <div className="h-[250px]">
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
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No severity data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Reports */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    Recent Reports
                  </h2>
                  <button 
                    onClick={() => navigate('/report')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View All
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
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentReports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#{report.id.substring(0, 6)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{report.location}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{report.type}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${report.severity === 'high' || report.severity === 'severe' ? 'bg-red-100 text-red-800' : 
                                  report.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-green-100 text-green-800'}`}>
                                {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{report.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  report.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'}`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No reports available</p>
                    <p className="text-gray-400 text-sm">Reports will appear here once they are submitted</p>
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
