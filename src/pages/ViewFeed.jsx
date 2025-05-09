import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X
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
      const response = await fetch('http://localhost:5000/api/feedbacks');
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
      const response = await fetch(`http://localhost:5000/api/feedbacks/${id}`, {
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
          await fetch('http://localhost:5000/api/user-notification', {
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
      const response = await fetch(`http://localhost:5000/api/feedbacks/${replyModal.feedback._id}/reply`, {
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
          await fetch('http://localhost:5000/api/user-notification', {
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
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      
      <div className="flex-1 pl-64">
        {/* Notification */}
        {notification.show && (
          <div 
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-md shadow-md flex items-center space-x-2 ${
              notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
              'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? 
              <CheckCircle className="h-5 w-5" /> : 
              <AlertCircle className="h-5 w-5" />
            }
            <span>{notification.message}</span>
          </div>
        )}

        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
              <button 
                onClick={fetchFeedbacks}
                className="flex items-center text-sm bg-white border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input 
                type="text"
                placeholder="Search by name, email, subject or message content"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <select 
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
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
        </div>

        {/* Feedback List */}
        {filteredFeedbacks.length > 0 ? (
          <div className="bg-white shadow overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/6" onClick={() => toggleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>Sender</span>
                      {sortConfig.key === 'name' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-2/6" onClick={() => toggleSort('subject')}>
                    <div className="flex items-center space-x-1">
                      <Inbox className="w-4 h-4" />
                      <span>Subject</span>
                      {sortConfig.key === 'subject' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/6" onClick={() => toggleSort('dateSubmitted')}>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Date</span>
                      {sortConfig.key === 'dateSubmitted' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeedbacks.map((feedback) => (
                  <tr key={feedback._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{feedback.name}</span>
                        <span className="text-sm text-gray-500">{feedback.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <div className="text-sm font-medium text-gray-900 truncate">{feedback.subject}</div>
                        <div className="text-sm text-gray-500 truncate">{feedback.message}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(feedback.dateSubmitted)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feedback.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {feedback.completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleStatusChange(feedback._id, !feedback.completed)}
                          disabled={submitting}
                          className={`inline-flex items-center px-2 py-1 border text-xs font-medium rounded ${
                            feedback.completed 
                              ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
                              : 'border-green-600 bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {feedback.completed ? 'Mark Pending' : 'Mark Done'}
                        </button>
                        <button
                          onClick={() => openReplyModal(feedback)}
                          className="inline-flex items-center px-2 py-1 border border-blue-600 bg-blue-600 text-xs font-medium rounded text-white hover:bg-blue-700"
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Reply
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <Inbox className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No feedbacks found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery || filters.status !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'There are no user feedbacks available.'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Reply Modal */}
      {replyModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reply to Feedback</h3>
                <button onClick={closeReplyModal} className="text-gray-400 hover:text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                <div className="mb-2">
                  <p className="text-sm text-gray-500">From: {replyModal.feedback.name} ({replyModal.feedback.email})</p>
                  <p className="text-sm font-medium mt-1">{replyModal.feedback.subject}</p>
                </div>
                <p className="text-sm text-gray-700">{replyModal.feedback.message}</p>
              </div>
              <div className="mb-4">
                <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-1">
                  Response
                </label>
                <textarea
                  id="reply"
                  rows={5}
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
                <p className="mt-2 text-sm text-gray-500">
                  Your reply will be sent from venkatmadhu232@gmail.com
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeReplyModal}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || submitting}
                  className={`px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center ${
                    !replyText.trim() || submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                  Send Reply
                </button>
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