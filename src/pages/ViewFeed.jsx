import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ViewFeed.css'; // Import custom CSS for animations
import { 
  Inbox, 
  Check, 
  ChevronDown, 
  Search, 
  Mail, 
  Calendar, 
  Filter, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  User,
  Loader2,
  X,
  MessageSquare,
  Clock,
  ArrowUpDown,
  Bell,
  ExternalLink,
  BarChart
} from 'lucide-react';
import Sidebar from "../components/Sidebar";

const ViewFeed = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'dateSubmitted', direction: 'desc' });
  const [filters, setFilters] = useState({ status: 'all' });
  const [replyModal, setReplyModal] = useState({ isOpen: false, feedback: null });
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("View Feedbacks");

  useEffect(() => {
    fetchFeedbacks();
    
    // Get user info from localStorage
    const storedUserId = localStorage.getItem('roadVisionUserId');
    const storedUserName = localStorage.getItem('roadVisionUserName');
    
    if (storedUserId) {
      setUserId(storedUserId);
    }
    
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://inspectify-backend.onrender.com/api/feedbacks');
      if (!response.ok) throw new Error('Failed to fetch feedbacks');
      const data = await response.json();
      
      // Ensure each feedback has a completed property
      const processedData = data.map(feedback => ({
        ...feedback,
        completed: feedback.completed === undefined ? false : feedback.completed
      }));
      
      setFeedbacks(processedData);
      setFilteredFeedbacks(processedData);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Could not load feedbacks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...feedbacks];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(feedback => 
        feedback.name.toLowerCase().includes(query) ||
        feedback.email.toLowerCase().includes(query) ||
        feedback.subject.toLowerCase().includes(query) ||
        feedback.message.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(feedback => 
        (filters.status === 'completed' && feedback.completed) || 
        (filters.status === 'pending' && !feedback.completed)
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'dateSubmitted') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredFeedbacks(result);
  }, [feedbacks, searchQuery, filters, sortConfig]);

  const toggleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleStatusChange = async (id, isCompleted) => {
    try {
      setSubmitting(true);
      
      // Get the feedback to access the userId
      const feedback = feedbacks.find(item => item._id === id);
      if (!feedback) {
        throw new Error('Feedback not found');
      }
      
      // API call to update feedback status
      const response = await fetch(`https://inspectify-backend.onrender.com/api/feedbacks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          completed: isCompleted,
          userId: feedback.userId // Include userId to identify which user to notify
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Update local state
      setFeedbacks(prev => 
        prev.map(item => 
          item._id === id ? { ...item, completed: isCompleted } : item
        )
      );
      
      // Create a notification for the user
      if (feedback.userId) {
        try {
          // Send notification to the user
          await fetch('https://inspectify-backend.onrender.com/api/user-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: feedback.userId,
              title: 'Feedback Status Updated',
              message: `Your feedback "${feedback.subject}" has been marked as ${isCompleted ? 'completed' : 'pending'}.`,
              type: 'feedback',
              details: {
                feedbackId: id,
                status: isCompleted ? 'completed' : 'pending',
                subject: feedback.subject
              }
            })
          });
          console.log('User notification sent successfully');
        } catch (notificationError) {
          console.error('Error sending user notification:', notificationError);
        }
      }
      
      showNotification(`Feedback marked as ${isCompleted ? 'completed' : 'pending'}`, 'success');
    } catch (err) {
      console.error('Error updating status:', err);
      showNotification(err.message || 'Failed to update status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openReplyModal = (feedback) => {
    setReplyModal({ isOpen: true, feedback });
    setReplyText('');
  };

  const closeReplyModal = () => {
    setReplyModal({ isOpen: false, feedback: null });
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      setSubmitting(true);
      // API call to send reply
      const response = await fetch(`https://inspectify-backend.onrender.com/api/feedbacks/${replyModal.feedback._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          replyText,
          recipientEmail: replyModal.feedback.email,
          recipientName: replyModal.feedback.name,
          senderEmail: 'venkatmadhu232@gmail.com', // Added sender email
          userId: replyModal.feedback.userId // Include userId to identify which user to notify
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reply');
      }
      
      // Send notification to the user if userId exists
      if (replyModal.feedback.userId) {
        try {
          // Send notification to the user
          await fetch('https://inspectify-backend.onrender.com/api/user-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: replyModal.feedback.userId,
              title: 'New Reply to Your Feedback',
              message: `You have received a reply to your feedback "${replyModal.feedback.subject}".`,
              type: 'feedback_reply',
              details: {
                feedbackId: replyModal.feedback._id,
                subject: replyModal.feedback.subject,
                replyText: replyText,
                replyDate: new Date()
              }
            })
          });
          console.log('User notification for reply sent successfully');
        } catch (notificationError) {
          console.error('Error sending user notification for reply:', notificationError);
        }
      }
      
      // Mark as completed if not already
      if (!replyModal.feedback.completed) {
        await handleStatusChange(replyModal.feedback._id, true);
      }
      
      closeReplyModal();
      showNotification('Reply sent successfully', 'success');
    } catch (err) {
      console.error('Error sending reply:', err);
      showNotification(err.message || 'Failed to send reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const showNotification = (message, type) => {
    // Hide any existing notification first
    setNotification({ show: false, message: '', type: '' });
    
    // Small delay before showing new notification for better UX
    setTimeout(() => {
      setNotification({ show: true, message, type });
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
        
        // After fade out animation completes, reset the message
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 300);
      }, 5000);
      
      // Clear timeout if component unmounts
      return () => clearTimeout(timer);
    }, 100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ">
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader2 className="animate-spin h-6 w-6" />
          <span className="font-medium">Loading feedback data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 flex items-center space-x-2">
          <AlertCircle className="h-6 w-6" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar activeTab={activeTab} userName={userName} userId={userId} />
      
      <div className="flex-1 ml-64 w-full">
        {/* Enhanced Notification */}
        {notification.show && (
          <div 
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 ease-in-out animate-fade-in-down ml-64 ${
              notification.type === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-l-4 border-green-500' 
                : 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-l-4 border-red-500'
            }`}
            style={{ maxWidth: '400px' }}
          >
            <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-green-200' : 'bg-red-200'}`}>
              {notification.type === 'success' ? 
                <CheckCircle className="h-5 w-5" /> : 
                <AlertCircle className="h-5 w-5" />
              }
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {notification.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification({ show: false, message: '', type: '' })}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Enhanced Header */}
        <header className="bg-gradient-to-r from-green-600 to-blue-800 shadow-md w-full">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <MessageSquare className="w-7 h-7 mr-2" />
                  Feedback Management
                </h1>
                <p className="text-blue-100 mt-1 text-sm p-10">
                  Manage and respond to user feedback efficiently
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 bg-opacity-30 text-white rounded-lg px-3 py-1.5 text-sm flex items-center">
                  <BarChart className="w-4 h-4 mr-1.5" />
                  <span>Total: {feedbacks.length}</span>
                </div>
                <button 
                  onClick={fetchFeedbacks}
                  className="flex items-center text-sm bg-white text-blue-700 font-medium rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Search and Filters */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-3 md:mb-0">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Search & Filters
            </h2>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1.5" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Feedback</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  id="search"
                  type="text"
                  placeholder="Search by name, email, subject or message content"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </div>
                <select 
                  id="status-filter"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all duration-200"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {searchQuery && (
              <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                <span>Search: {searchQuery}</span>
                <button onClick={() => setSearchQuery('')} className="ml-1 text-blue-500 hover:text-blue-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {filters.status !== 'all' && (
              <div className="inline-flex items-center bg-purple-50 text-purple-700 rounded-full px-3 py-1 text-sm">
                <span>Status: {filters.status}</span>
                <button onClick={() => setFilters({...filters, status: 'all'})} className="ml-1 text-purple-500 hover:text-purple-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Feedback List */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Inbox className="w-5 h-5 mr-2 text-blue-600" />
            Feedback List
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredFeedbacks.length} {filteredFeedbacks.length === 1 ? 'item' : 'items'})
            </span>
          </h2>
        </div>
        
        {filteredFeedbacks.length > 0 ? (
          <div className="bg-white shadow-md overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-gray-200 w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer w-1/6 hover:bg-gray-100 transition-colors" onClick={() => toggleSort('name')}>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>Sender</span>
                        {sortConfig.key === 'name' && (
                          <span className={`text-blue-600 transition-transform duration-200 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`}>
                            ▼
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer w-2/6 hover:bg-gray-100 transition-colors" onClick={() => toggleSort('subject')}>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span>Subject</span>
                        {sortConfig.key === 'subject' && (
                          <span className={`text-blue-600 transition-transform duration-200 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`}>
                            ▼
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer w-1/6 hover:bg-gray-100 transition-colors" onClick={() => toggleSort('dateSubmitted')}>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Date</span>
                        {sortConfig.key === 'dateSubmitted' && (
                          <span className={`text-blue-600 transition-transform duration-200 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`}>
                            ▼
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/12">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-gray-500" />
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFeedbacks.map((feedback, index) => (
                    <tr key={feedback._id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                            {feedback.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{feedback.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {feedback.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-md">
                          <div className="text-sm font-medium text-gray-900 truncate">{feedback.subject}</div>
                          <div className="text-sm text-gray-500 truncate mt-1">{feedback.message}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(feedback.dateSubmitted).split(',')[0]}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatDate(feedback.dateSubmitted).split(',')[1]}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          feedback.completed 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${feedback.completed ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                          {feedback.completed ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleStatusChange(feedback._id, !feedback.completed)}
                            disabled={submitting}
                            className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-lg shadow-sm transition-all duration-200 ${
                              feedback.completed 
                                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900' 
                                : 'border-green-600 bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            {feedback.completed ? 'Mark Pending' : 'Mark Done'}
                          </button>
                          <button
                            onClick={() => openReplyModal(feedback)}
                            className="inline-flex items-center px-3 py-1.5 border border-blue-600 bg-blue-600 text-xs font-medium rounded-lg text-white hover:bg-blue-700 shadow-sm transition-all duration-200"
                          >
                            <Mail className="w-3.5 h-3.5 mr-1.5" />
                            Reply
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-500 flex justify-between items-center">
              <div>
                Showing {filteredFeedbacks.length} of {feedbacks.length} feedbacks
              </div>
              <div className="flex items-center">
                <span className="mr-2">Sort by:</span>
                <select 
                  className="border border-gray-300 rounded-md text-xs py-1 px-2"
                  value={sortConfig.key}
                  onChange={(e) => toggleSort(e.target.value)}
                >
                  <option value="dateSubmitted">Date</option>
                  <option value="name">Sender</option>
                  <option value="subject">Subject</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-xl p-12 text-center border border-gray-200">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Inbox className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No feedbacks found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filters.status !== 'all' 
                  ? 'No results match your current search or filter criteria. Try adjusting your parameters.'
                  : 'There are no user feedbacks available in the system yet.'}
              </p>
              <button 
                onClick={fetchFeedbacks}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Enhanced Reply Modal */}
      {replyModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300" style={{ paddingLeft: '16rem' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 transform transition-all duration-300 ease-out animate-fade-in-up">
            <div className="border-b border-gray-200">
              <div className="px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Mail className="h-5 w-5 text-blue-600 mr-2" />
                  Reply to Feedback
                </h3>
                <button 
                  onClick={closeReplyModal} 
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-blue-50 p-5 rounded-lg border border-blue-100">
                <div className="flex items-start mb-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold mr-3">
                    {replyModal.feedback.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{replyModal.feedback.name}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {replyModal.feedback.email}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(replyModal.feedback.dateSubmitted)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      replyModal.feedback.completed 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${replyModal.feedback.completed ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {replyModal.feedback.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
                
                <div className="border-b border-blue-200 mb-3 pb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Subject:</h4>
                  <p className="text-sm text-gray-800">{replyModal.feedback.subject}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Message:</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{replyModal.feedback.message}</p>
                </div>
              </div>
              
              <div className="mb-5">
                <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1.5 text-blue-600" />
                  Your Response
                </label>
                <div className="relative">
                  <textarea
                    id="reply"
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  ></textarea>
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {replyText.length} characters
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  <span>Your reply will be sent from <span className="font-medium">venkatmadhu232@gmail.com</span></span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {!replyModal.feedback.completed && 
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" />
                      <span>This feedback will be marked as completed upon reply</span>
                    </div>
                  }
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={closeReplyModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 shadow-sm transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || submitting}
                    className={`px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all duration-200 flex items-center font-medium ${
                      !replyText.trim() || submitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ViewFeed;