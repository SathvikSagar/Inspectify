import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaDownload,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTable,
  FaTh as FaThLarge,
  FaChartArea,
} from "react-icons/fa";
import {
  Loader2,
  MapPin,
  CalendarDays,
  Image as ImageIcon,
  LocateFixed,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const AuthorityPage = () => {
  const [activeTab, setActiveTab] = useState("Image Uploads");
  const [roadData, setRoadData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ address: "", date: "", status: "all" });
  const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [imageModal, setImageModal] = useState({ open: false, image: null, item: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, itemId: null, itemName: null });
  const [deleting, setDeleting] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalInspections: { count: 0, newThisWeek: 0 },
    highSeverityIssues: { count: 0, percentage: 0 },
    processingTime: { average: 0 },
    resolutionRate: { percentage: 0, resolvedLastMonth: 0 },
    statusCounts: { pending: 0, processed: 0, critical: 0, resolved: 0 }
  });
  const navigate = useNavigate();
  
  // Get user info from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('roadVisionUserId');
    const storedUserName = localStorage.getItem('roadVisionUserName');
    
    if (storedUserId) {
      setUserId(storedUserId);
      
      // Check if user is admin and redirect if not
      const isAdmin = storedUserId.startsWith('admin_');
      if (!isAdmin) {
        console.log("Non-admin user detected in AuthorityPage component, redirecting to user dashboard");
        navigate('/user');
      }
    } else {
      // If no user ID is found, redirect to login
      console.log("No user ID found, redirecting to login");
      navigate('/');
    }
    
    if (storedUserName) {
      console.log("Setting user name from localStorage:", storedUserName);
      setUserName(storedUserName);
    } else {
      console.log("No user name found in localStorage");
      // Set a default name if none is found
      setUserName("Administrator");
    }
  }, [navigate]);
  
  // Socket.IO connection for real-time notifications
  useEffect(() => {
    // Only connect to socket.io if we have a userId
    if (!userId) return;
    
    // Import socket.io-client dynamically
    import('socket.io-client').then(({ io }) => {
      const socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
      });
      
      socket.on('connect', () => {
        console.log('Socket.IO connected in AuthorityPage');
        // Authenticate with the server using userId
        socket.emit('authenticate', userId);
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error in AuthorityPage:', error);
      });
      
      return () => {
        socket.disconnect();
      };
    }).catch(err => {
      console.error('Failed to load socket.io-client in AuthorityPage:', err);
    });
  }, [userId]); // Re-connect if userId changes

  // Status options for filtering
  const statuses = ["Pending", "Processed", "Critical", "Resolved"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch data for the current user if not an admin
        const isAdmin = userId && userId.startsWith('admin_');
        const baseUrl = "http://localhost:5000";
        const roadDataUrl = isAdmin 
          ? `${baseUrl}/api/road-data` // Admin sees all data
          : `${baseUrl}/api/road-data?userId=${userId}`; // Regular users see only their data
        
        const dashboardStatsUrl = isAdmin
          ? `${baseUrl}/api/dashboard-stats`
          : `${baseUrl}/api/dashboard-stats?userId=${userId}`;
        
        // Fetch road data
        const roadDataResponse = await fetch(roadDataUrl);
        if (!roadDataResponse.ok) throw new Error("Failed to fetch road data");
        const roadDataJson = await roadDataResponse.json();
        
        // Fetch dashboard stats
        const statsResponse = await fetch(dashboardStatsUrl);
        if (!statsResponse.ok) throw new Error("Failed to fetch dashboard stats");
        const statsData = await statsResponse.json();
        
        // Process road data
        const enhancedData = roadDataJson.map(item => {
          // If userName is not provided, create a default one
          if (!item.userName) {
            if (item.userId) {
              if (item.userId.startsWith('admin_')) {
                item.userName = 'Administrator';
              } else if (item.userId.match(/^[0-9a-f]{24}$/i)) {
                // For MongoDB ObjectIds, use a friendly format
                item.userName = 'User ' + item.userId.substring(0, 5);
              } else {
                // Try to extract name from userId
                const parts = item.userId.split('_');
                if (parts.length > 1) {
                  item.userName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
                } else {
                  item.userName = 'Unknown User';
                }
              }
            } else {
              item.userName = 'Unknown User';
            }
          }
          
          return item;
        });
        
        // Update state with fetched data
        setRoadData(enhancedData);
        setFilteredData(enhancedData);
        setDashboardStats(statsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Could not fetch data. Please try again later.");
        setLoading(false);
      }
    };
    
    // Only fetch data if we have a userId
    if (userId) {
      fetchData();
    }
  }, [userId]); // Re-fetch when userId changes

  const handlePredictClick = (item) => {
    navigate("/upload", {
      state: {
        imagePath: item.imagePath,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
      },
    });
  };

  const handleViewClick = (item) => {
    // Open image in a modal
    setImageModal({
      open: true,
      image: `http://localhost:5000/${item.imagePath}`,
      item: item
    });
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === currentItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentItems.map(item => item._id));
    }
  };

  const clearFilters = () => {
    setFilters({ address: "", date: "", status: "all" });
    setSearchTerm("");
  };
  
  const handleDeleteClick = (item) => {
    setDeleteModal({
      open: true,
      itemId: item._id,
      itemName: item.address || `Image ${item._id.substring(0, 8)}`
    });
  };
  
  const handleDeleteConfirm = async () => {
    if (!deleteModal.itemId || deleting) return;
    
    try {
      setDeleting(true);
      
      console.log("Deleting item with ID:", deleteModal.itemId);
      
      // Make API call to delete the item
      const response = await fetch(`http://localhost:5000/api/road-data/${deleteModal.itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.status} ${response.statusText}`);
      }
      
      // Remove the item from both the main data and filtered data states
      setRoadData(prevData => prevData.filter(item => item._id !== deleteModal.itemId));
      setFilteredData(prevData => prevData.filter(item => item._id !== deleteModal.itemId));
      
      // Close the modal
      setDeleteModal({ open: false, itemId: null, itemName: null });
      
      // Show success message (you could add a toast notification here)
      console.log(`Successfully deleted item ${deleteModal.itemId}`);
      
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(`Failed to delete item: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    let updated = [...roadData];
    
    // Apply search term
    if (searchTerm) {
      updated = updated.filter(item => 
        item.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filters
    if (filters.address) {
      updated = updated.filter((item) =>
        item.address?.toLowerCase().includes(filters.address.toLowerCase())
      );
    }
    if (filters.date) {
      updated = updated.filter((item) =>
        new Date(item.timestamp).toISOString().startsWith(filters.date)
      );
    }
    if (filters.status !== "all") {
      updated = updated.filter((item) => item.status === filters.status);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      updated.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === "timestamp") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        return sortConfig.direction === "asc"
          ? aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          : aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      });
    }
    
    setFilteredData(updated);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, sortConfig, roadData, searchTerm]);

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Tab change is now handled by the Sidebar component

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);



  // Image Modal Component
  const ImageModal = () => {
    if (!imageModal.open) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden bg-white rounded-lg shadow-xl">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Image Details</h3>
            <button 
              onClick={() => setImageModal({ open: false, image: null, item: null })}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-4 flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={imageModal.image} 
                  alt="Road condition" 
                  className="w-full h-auto object-contain max-h-[70vh]"
                />
              </div>
            </div>
            
            <div className="md:w-1/3 space-y-4">
              {imageModal.item && (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">LOCATION</h4>
                    <p className="text-gray-900 mt-1">{imageModal.item.address || 'No address available'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {imageModal.item.latitude}, {imageModal.item.longitude}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">UPLOADED BY</h4>
                    <div className="flex items-center mt-1">
                      <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2">
                        {imageModal.item.userName ? imageModal.item.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-gray-900">{imageModal.item.userName || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">{imageModal.item.userId || 'No ID'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">TIMESTAMP</h4>
                    <p className="text-gray-900 mt-1">
                      {new Date(imageModal.item.timestamp).toLocaleDateString()} at {' '}
                      {new Date(imageModal.item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setImageModal({ open: false, image: null, item: null });
                        handlePredictClick(imageModal.item);
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                    >
                      <FaChartArea className="mr-2" />
                      Analyze This Image
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Delete Confirmation Modal Component
  const DeleteConfirmationModal = () => {
    if (!deleteModal.open) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this item? <br />
              <span className="font-medium text-gray-700">{deleteModal.itemName}</span><br />
              This action cannot be undone.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteModal({ open: false, itemId: null, itemName: null })}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Image Modal */}
      <ImageModal />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
      
      {/* Sidebar Component */}
      <Sidebar activeTab={activeTab} userName={userName} userId={userId} />

      {/* Main Content - with left margin to account for fixed sidebar */}
      <div className="flex-1 px-6 py-8 overflow-auto ml-64">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Road Condition Monitoring
          </h1>
          <p className="text-gray-500">
            View and analyze road conditions from uploaded images
          </p>
        </header>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Inspections */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <ImageIcon className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-1">
                All Time
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Inspections</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-800">{dashboardStats.totalInspections.count}</span>
              <span className="ml-2 text-xs text-green-600">
                +{dashboardStats.totalInspections.newThisWeek} this week
              </span>
            </div>
          </div>
          
          {/* Damage Severity */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <span className="text-xs font-medium text-red-600 bg-red-50 rounded-full px-2 py-1">
                Critical
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">High Severity Issues</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-800">
                {dashboardStats.highSeverityIssues.count}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                {dashboardStats.highSeverityIssues.percentage}% of total
              </span>
            </div>
          </div>
          
          {/* Average Processing Time */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-1">
                Performance
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Avg. Processing Time</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-800">
                {dashboardStats.processingTime.average}s
              </span>
              <span className="ml-2 text-xs text-gray-500">
                per image
              </span>
            </div>
          </div>
          
          {/* Resolution Rate */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 rounded-full px-2 py-1">
                Efficiency
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Resolution Rate</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-800">
                {dashboardStats.resolutionRate.percentage}%
              </span>
              <span className="ml-2 text-xs text-green-600">
                {dashboardStats.resolutionRate.resolvedLastMonth} in last 30 days
              </span>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-grow w-full lg:w-auto">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by address or ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <FaFilter className="mr-2" />
              Filters
              {isFilterOpen ? <ChevronUp className="ml-2" /> : <ChevronDown className="ml-2" />}
            </button>
            
            <div className="inline-flex rounded-lg overflow-hidden">
              <button 
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 border ${viewMode === "table" 
                  ? "bg-green-600 text-white border-green-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
              >
                <FaTable className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 border ${viewMode === "grid" 
                  ? "bg-green-600 text-white border-green-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
              >
                <FaThLarge className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {isFilterOpen && (
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700">Advanced Filters</h3>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter by address"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
                    value={filters.address}
                    onChange={(e) => setFilters({ ...filters, address: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Date</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Status</label>
                <select
                  className="w-full pl-3 pr-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2"
              >
                Clear All
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center mt-10 text-blue-600 bg-white p-8 rounded-xl shadow-sm">
            <Loader2 className="animate-spin h-8 w-8 mb-4" />
            <p>Loading road data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm">
            <p className="text-center flex items-center justify-center">
              <AlertTriangle className="mr-2" />
              {error}
            </p>
          </div>
        ) : filteredData.length > 0 ? (
          <>
            {viewMode === "table" ? (
              <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 font-medium">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded text-green-600 focus:ring focus:ring-green-200"
                              checked={selectedItems.length === currentItems.length && currentItems.length > 0}
                              onChange={handleSelectAll}
                            />
                          </div>
                        </th>
                        <th className="px-6 py-3 font-medium">
                          <div className="flex items-center">
                            <ImageIcon className="inline w-4 h-4 mr-1 text-gray-400" />
                            <span>Image</span>
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 font-medium cursor-pointer"
                          onClick={() => toggleSort("address")}
                        >
                          <div className="flex items-center">
                            <MapPin className="inline w-4 h-4 mr-1 text-gray-400" />
                            <span>Location</span>
                            {sortConfig.key === "address" && (
                              sortConfig.direction === "asc" 
                                ? <FaSortAmountUp className="ml-1 text-green-600" />
                                : <FaSortAmountDown className="ml-1 text-green-600" />
                            )}
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 font-medium cursor-pointer"
                          onClick={() => toggleSort("timestamp")}
                        >
                          <div className="flex items-center">
                            <CalendarDays className="inline w-4 h-4 mr-1 text-gray-400" />
                            <span>Time</span>
                            {sortConfig.key === "timestamp" && (
                              sortConfig.direction === "asc" 
                                ? <FaSortAmountUp className="ml-1 text-green-600" />
                                : <FaSortAmountDown className="ml-1 text-green-600" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 font-medium">
                          <div className="flex items-center">
                            <span>Uploaded By</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-center font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item, index) => (
                        <tr
                          key={item._id}
                          className={`hover:bg-gray-50 transition ${
                            selectedItems.includes(item._id) ? "bg-green-50" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              className="rounded text-green-600 focus:ring focus:ring-green-200"
                              checked={selectedItems.includes(item._id)}
                              onChange={() => handleSelectItem(item._id)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <img
                              src={`http://localhost:5000/${item.imagePath}`}
                              alt="Road"
                              className="w-24 h-16 object-cover rounded-md shadow border cursor-pointer hover:opacity-90 transition"
                              onClick={() => handleViewClick(item)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="line-clamp-2">{item.address || "N/A"}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {typeof item.latitude === 'number' ? item.latitude.toFixed(4) : 'N/A'}, 
                              {typeof item.longitude === 'number' ? item.longitude.toFixed(4) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>{new Date(item.timestamp).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2">
                                {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-medium text-gray-700">{item.userName || 'Unknown User'}</div>
                                <div className="text-xs text-gray-500">{item.userId || 'No ID'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleViewClick(item)}
                                className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handlePredictClick(item)}
                                className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                                title="Predict"
                              >
                                <FaChartArea />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item)}
                                className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentItems.map((item) => (
                  <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                    <div className="relative">
                      <img
                        src={`http://localhost:5000/${item.imagePath}`}
                        alt="Road"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          View
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start mb-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-1 mr-1 flex-shrink-0" />
                        <div className="text-sm text-gray-800 line-clamp-2">
                          {item.address || "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <CalendarDays className="w-3 h-3 mr-1" />
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Uploaded By</div>
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2 text-xs">
                            {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="text-sm text-gray-700">{item.userName || 'Unknown User'}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleViewClick(item)}
                          className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm flex items-center justify-center"
                        >
                          <FaEye className="mr-1" /> View
                        </button>
                        <button
                          onClick={() => handlePredictClick(item)}
                          className="flex-1 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm flex items-center justify-center"
                        >
                          <FaChartArea className="mr-1" /> Predict
                        </button>
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="w-full py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm flex items-center justify-center"
                        >
                          <Trash2 size={16} className="mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded border ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    // Logic to determine which page numbers to show
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1 rounded border ${
                          currentPage === pageNum
                            ? "bg-green-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded border ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center bg-white p-8 rounded-xl shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <ImageIcon className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No road data found</h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
            {(filters.address || filters.date || filters.status !== "all" || searchTerm) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Image Preview Modal - Would be implemented as a state-controlled component */}
    </div>
  );
};




export default AuthorityPage;