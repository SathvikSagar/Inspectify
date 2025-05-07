import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { BeatLoader } from 'react-spinners';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  Info,
  X,
  Zap,
  ChevronRight,
  Camera,
  BarChart,
  MapPin,
  FileText
} from 'lucide-react';
import Sidebar from "../components/Sidebar";

const Upload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const { imagePath, latitude, longitude, address: initialAddress } = location.state || {};

  const [address, setAddress] = useState(initialAddress || 'Fetching...');
  const [lat, setLat] = useState(latitude || null);
  const [lng, setLng] = useState(longitude || null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [notification, setNotification] = useState(null);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (imagePath) {
      setPreviewUrl(`http://localhost:5000/${imagePath}`);
    }
  }, [imagePath]);

  useEffect(() => {
    if (!initialAddress && lat && lng) {
      fetchAddress(lat, lng);
    }
  }, [lat, lng]);

  // Get user ID from localStorage
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("Image Uploads");
  
  useEffect(() => {
    const storedUserId = localStorage.getItem('roadVisionUserId');
    const storedUserName = localStorage.getItem('roadVisionUserName');
    
    if (storedUserId) {
      setUserId(storedUserId);
    }
    
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);
  
  useEffect(() => {
    // Only connect to socket.io if we have a userId
    if (!userId) return;
    
    // Import socket.io-client dynamically to avoid issues
    import('socket.io-client').then(({ io }) => {
      const socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'] // Try WebSocket first, then fall back to polling
      });
      
      socket.on('connect', () => {
        console.log('Socket.IO connected in Upload');
        // Authenticate with the server using userId
        socket.emit('authenticate', userId);
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error in Upload:', error);
      });
      
      socket.on('prediction-complete', (message) => {
        setNotification(message.message || 'Notification received');
        setTimeout(() => setNotification(null), 5000);
      });
      
      socket.on('analysis-complete', (message) => {
        setNotification(message.message || 'Analysis completed');
        setTimeout(() => setNotification(null), 5000);
      });
      
      return () => {
        socket.disconnect();
      };
    }).catch(err => {
      console.error('Failed to load socket.io-client:', err);
    });
  }, [userId]); // Re-connect if userId changes

  const fetchAddress = async (latitude, longitude) => {
    try {
      const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress('Address not found.');
      }
    } catch {
      setAddress('Failed to fetch address.');
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imagePath || loading) return;
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    
    // Show immediate feedback to user
    setNotification("Starting image analysis... This may take a few seconds.");

    try {
      // Start timer to measure performance
      const startTime = performance.now();
      
      // Fetch the image with timeout and optimized settings
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`http://localhost:5000/${imagePath}`, {
        signal: controller.signal,
        cache: 'no-store', // Prevent caching
        priority: 'high'   // Set high priority
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Failed to fetch image');
      const imageBlob = await response.blob();

      // Prepare form data with all necessary information
      const formData = new FormData();
      formData.append('image', imageBlob, 'image.jpg');
      formData.append('latitude', lat?.toString() || '');
      formData.append('longitude', lng?.toString() || '');
      
      // Update notification with progress indicators
      setNotification("Processing image... Analyzing road damage patterns.");
      
      // Set up a progress indicator
      let progressCounter = 0;
      const progressInterval = setInterval(() => {
        progressCounter += 5;
        if (progressCounter <= 100) {
          setNotification(`Processing image... ${progressCounter}% complete. Please wait.`);
        }
      }, 3000); // Update every 3 seconds
      
      // Send analysis request with timeout
      const analyzeController = new AbortController();
      const analyzeTimeoutId = setTimeout(() => analyzeController.abort(), 60000); // 60 second timeout
      
      const analyzeResponse = await fetch('http://localhost:5000/analyze-damage', {
        method: 'POST',
        body: formData,
        signal: analyzeController.signal,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });   
      clearTimeout(analyzeTimeoutId);
      clearInterval(progressInterval); // Clear the progress interval

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Image analysis failed.');
      }
      
      const data = await analyzeResponse.json();
      
      // Calculate total processing time
      const processingTime = ((performance.now() - startTime) / 1000).toFixed(1);
      console.log(`Total analysis time: ${processingTime} seconds`);
      
      // Update state with results
      setAnalysisResult({
        ...data,
        clientProcessingTime: processingTime
      });
      
      // Show success notification with processing time
      setNotification(`Analysis completed in ${processingTime} seconds!`);

      // Update location if available
      if (data.latitude && data.longitude) {
        setLat(data.latitude);
        setLng(data.longitude);
        fetchAddress(data.latitude, data.longitude);
      }

      // Save results in background
      saveAnalysisResult(data).catch(e => 
        console.error("Error saving analysis result:", e)
      );
      
    } catch (err) {
      console.error("Analysis error:", err);
      clearInterval(progressInterval); // Clear the progress interval
      setError(err.message || "An unexpected error occurred during analysis.");
      setNotification(null);
    } finally {
      clearInterval(progressInterval); // Ensure interval is cleared
      setLoading(false);
    }
  };

  const saveAnalysisResult = async (result) => {
    try {
      // Determine status based on severity level
      let status = 'Pending';
      let severityLevel = result.severity?.level?.toLowerCase() || 'unknown';
      
      // Map any non-standard severity levels to valid ones
      if (severityLevel === 'medium') {
        severityLevel = 'moderate';
      }
      
      if (severityLevel === 'severe' || severityLevel === 'high') {
        status = 'Critical';
      } else if (severityLevel === 'moderate') {
        status = 'Processed';
      } else if (severityLevel === 'low') {
        status = 'Resolved';
      }
      
      // Calculate numeric severity value for consistency with AuthorityPage
      let severityValue = 50; // Default
      if (severityLevel === 'severe' || severityLevel === 'high') {
        severityValue = 85;
      } else if (severityLevel === 'moderate') {
        severityValue = 60;
      } else if (severityLevel === 'low') {
        severityValue = 30;
      }
      
      // Get the canvas with bounding boxes as base64 image
      let boundingBoxImage = null;
      if (canvasRef.current && result.detections && result.detections.length > 0) {
        try {
          // Make sure bounding boxes are drawn and wait for completion
          await drawBoundingBoxes();
          
          // Add a small delay to ensure rendering is complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Convert canvas to base64 with reduced quality to decrease payload size
          boundingBoxImage = canvasRef.current.toDataURL('image/jpeg', 0.7);
          console.log("Bounding box image captured from canvas successfully");
        } catch (e) {
          console.error("Error capturing canvas image:", e);
        }
      } else {
        console.warn("Cannot capture bounding box image - missing canvas, detections, or no detections found");
      }
      
      console.log("Preparing to save analysis result...");
      
      // Create the request body
      const requestBody = {
        imagePath,
        latitude: lat,
        longitude: lng,
        // Only include essential parts of the analysis result to reduce payload size
        analysisResult: {
          detections: result.detections,
          severity: result.severity,
          processing_time: result.processing_time,
          vit_predictions: result.vit_predictions,
          clientProcessingTime: result.clientProcessingTime
        },
        address: address,
        status: status,
        severity: severityValue,
        severityLevel: severityLevel,
        userId: userId, // Ensure user ID is included
        timestamp: new Date().toISOString(),
        boundingBoxImage // Include the base64 image with bounding boxes
      };
      
      // Log the size of the request to help with debugging
      const requestSize = JSON.stringify(requestBody).length / (1024 * 1024);
      console.log(`Request size: ${requestSize.toFixed(2)} MB`);
      
      // If the request is too large, show a warning
      if (requestSize > 40) {
        console.warn("Warning: Request size is very large and may cause issues");
        setNotification("Warning: Image is very large. Processing may take longer.");
      }
      
      const saveResponse = await fetch('http://localhost:5000/save-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      // Check for non-JSON responses (like HTML error pages)
      const contentType = saveResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned non-JSON response: ${await saveResponse.text()}`);
      }

      if (!saveResponse.ok) {
        // Try to parse error as JSON, but handle non-JSON responses too
        let errorMessage = 'Failed to save analysis result.';
        try {
          const errorData = await saveResponse.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse JSON, try to get the text
          try {
            const errorText = await saveResponse.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error("Could not parse error response:", textError);
          }
        }
        throw new Error(`Server error (${saveResponse.status}): ${errorMessage}`);
      }
      
      const responseData = await saveResponse.json();
      console.log("Save response:", responseData);
      console.log(`Analysis saved with status: ${status}, severity: ${severityLevel} (${severityValue}%)`);
      
      if (responseData.boundingBoxImagePath) {
        console.log(`Bounding box image saved at: ${responseData.boundingBoxImagePath}`);
      }
      
      // Show success notification with more details
      const detectionCount = responseData.detectionCount || result.detections?.length || 0;
      const severityText = responseData.severity || severityLevel;
      setNotification(
        `Analysis saved successfully! Found ${detectionCount} damage detections with ${severityText} severity.`
      );
    } catch (error) {
      console.error("Error saving analysis:", error);
      setError(error.message || 'Failed to save the analysis result.');
      setNotification(null); // Clear any existing notification
      
      // Show a more user-friendly error message
      if (error.message.includes("413") || error.message.includes("Payload Too Large")) {
        setError("The image is too large to upload. Please try a smaller image or reduce the quality.");
      }
    }
  };

  const drawBoundingBoxes = () => {
    return new Promise((resolve, reject) => {
      if (!analysisResult?.detections || !canvasRef.current || !previewUrl) {
        console.warn("Missing required elements for drawing bounding boxes");
        resolve(false);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = previewUrl;

      img.onload = () => {
        try {
          // Set canvas dimensions to match the image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Clear canvas and draw the image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Draw each bounding box with color based on damage type
          analysisResult.detections.forEach(({ bbox, class: className, color }) => {
            const [x, y, width, height] = bbox;
            
            // Use the color from the detection if available, otherwise use red
            ctx.strokeStyle = color ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : 'red';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            
            // Add label if class name is available
            if (className) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(x, y - 20, ctx.measureText(className).width + 10, 20);
              ctx.fillStyle = 'white';
              ctx.font = '14px Arial';
              ctx.fillText(className, x + 5, y - 5);
            }
          });
          
          console.log(`Drew ${analysisResult.detections.length} bounding boxes on canvas`);
          resolve(true);
        } catch (err) {
          console.error("Error drawing bounding boxes:", err);
          reject(err);
        }
      };

      img.onerror = (err) => {
        console.error("Error loading image for bounding boxes:", err);
        reject(err);
      };
    });
  };

  useEffect(() => {
    if (analysisResult && previewUrl) {
      // Draw bounding boxes when analysis result or preview URL changes
      drawBoundingBoxes()
        .then(success => {
          if (success) {
            console.log("Bounding boxes drawn successfully in useEffect");
          }
        })
        .catch(err => {
          console.error("Error drawing bounding boxes in useEffect:", err);
        });
    }
  }, [analysisResult, previewUrl]);

  const getMarkerColor = (severity) => {
    switch ((severity || '').toLowerCase()) {
      case 'severe':
      case 'high':
        return 'red';
      case 'moderate':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'blue';
    }
  };

  const createCustomIcon = (color) =>
    new L.DivIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

  // Using the shared Sidebar component instead of a local one

  // Helper function to get severity badge styling
  const getSeverityBadge = (severity) => {
    const level = (severity || '').toLowerCase();
    
    if (level === 'severe' || level === 'high') {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: <AlertTriangle size={14} className="text-red-600" />
      };
    } else if (level === 'moderate') {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        icon: <AlertTriangle size={14} className="text-orange-600" />
      };
    } else if (level === 'low') {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: <CheckCircle size={14} className="text-green-600" />
      };
    } else {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: <Info size={14} className="text-blue-600" />
      };
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar Component */}
      <Sidebar activeTab={activeTab} userName={userName} userId={userId} />

      <main className="flex-1 p-8 ml-64">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Search className="h-6 w-6 text-green-700" />
              </div>
              Analyze Road Damage
            </h1>
            <p className="text-gray-500 mt-2">Upload and analyze road images to detect and classify damage</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Clock size={16} />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg shadow-sm flex items-center gap-3 animate-fadeIn">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>{notification}</span>
            <button 
              onClick={() => setNotification(null)} 
              className="ml-auto text-green-700 hover:text-green-900"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image Preview */}
          <div className="lg:col-span-2 space-y-6">
            {previewUrl ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="font-medium text-gray-700 flex items-center gap-2">
                    <Camera size={18} />
                    Road Image
                  </h2>
                  {analysisResult && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getSeverityBadge(analysisResult.severity?.level).bg} ${getSeverityBadge(analysisResult.severity?.level).text}`}>
                      {getSeverityBadge(analysisResult.severity?.level).icon}
                      {analysisResult.severity?.level || 'Unknown'} Severity
                    </div>
                  )}
                </div>
                <div className="relative w-full h-[400px] overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Road Preview"
                    className="absolute top-0 left-0 w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                  <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={handleAnalyzeImage}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 font-medium"
                  >
                    {loading ? (
                      <>
                        <BeatLoader color="#fff" size={8} />
                        <span>Processing Image...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        Analyze Damage
                      </>
                    )}
                  </button>
                  {error && (
                    <div className="mt-3 text-red-600 text-sm flex items-center gap-2 justify-center">
                      <AlertTriangle size={16} />
                      {error}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 flex flex-col items-center justify-center h-[400px]">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Camera size={32} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Image Selected</h3>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  Please navigate from the camera capture screen or select an image to analyze road damage.
                </p>
                <button
                  onClick={() => navigate('/authority')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Go to Home
                </button>
              </div>
            )}

            {/* Map Section */}
            {showMap && lat && lng && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-medium text-gray-700 flex items-center gap-2">
                    <MapPin size={18} />
                    Location Map
                  </h2>
                </div>
                <div className="h-[350px]">
                  <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} className="h-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[lat, lng]} icon={createCustomIcon(getMarkerColor(analysisResult?.severity?.level))}>
                      <Popup>
                        <div className="text-sm">
                          <p className="font-medium">{address}</p>
                          <p className="text-gray-500 mt-1">Severity: {analysisResult?.severity?.level || 'Unknown'}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Analysis Results */}
          <div className="space-y-6">
            {analysisResult ? (
              <>
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="font-medium text-gray-700 flex items-center gap-2">
                      <BarChart size={18} />
                      Damage Analysis
                    </h2>
                  </div>
                  <div className="p-5 space-y-5">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">LOCATION DETAILS</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">Address</p>
                            <p className="text-sm text-gray-600">{address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Layers size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">Coordinates</p>
                            <p className="text-sm text-gray-600">{lat}, {lng}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock size={18} className="text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">Timestamp</p>
                            <p className="text-sm text-gray-600">{new Date(analysisResult.timestamp || Date.now()).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">DAMAGE ASSESSMENT</h3>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-800 mb-2">Detected Damage Types:</p>
                        <div className="flex flex-wrap gap-2">
                          {(analysisResult.vit_predictions || []).length > 0 ? (
                            (analysisResult.vit_predictions || []).map((type, i) => (
                              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                {type}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No specific damage types detected</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Severity Level:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getSeverityBadge(analysisResult.severity?.level).bg} ${getSeverityBadge(analysisResult.severity?.level).text}`}>
                            {getSeverityBadge(analysisResult.severity?.level).icon}
                            {analysisResult.severity?.level || 'Unknown'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Damage Coverage:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  ['high', 'severe'].includes((analysisResult.severity?.level || '').toLowerCase())
                                    ? 'bg-red-500'
                                    : (analysisResult.severity?.level || '').toLowerCase() === 'moderate'
                                      ? 'bg-orange-500'
                                      : 'bg-green-500'
                                }`}
                                style={{ width: `${analysisResult.severity?.area_score || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {analysisResult.severity?.area_score?.toFixed(1) || 'N/A'}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Repair Priority:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            ['high', 'severe'].includes((analysisResult.severity?.level || '').toLowerCase())
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {['high', 'severe'].includes((analysisResult.severity?.level || '').toLowerCase())
                              ? 'Immediate Action'
                              : 'Schedule Repair'}
                          </span>
                        </div>
                        
                        {/* Processing Time Information */}
                        {(analysisResult.processing_time || analysisResult.clientProcessingTime) && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">PERFORMANCE METRICS</h3>
                            <div className="space-y-2">
                              {analysisResult.processing_time && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-700">AI Processing Time:</span>
                                  <span className="text-sm font-medium">{analysisResult.processing_time} sec</span>
                                </div>
                              )}
                              {analysisResult.clientProcessingTime && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-700">Total Processing Time:</span>
                                  <span className="text-sm font-medium">{analysisResult.clientProcessingTime} sec</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={() => setShowMap(prev => !prev)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <MapPin size={16} />
                      {showMap ? 'Hide Map' : 'View on Map'}
                    </button>
                    <button
                      onClick={() => navigate('/report')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <FileText size={16} />
                      View All Reports
                    </button>
                  </div>
                </div>
              </>
            ) : previewUrl ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-center">
                <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                  <Info size={24} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Ready for Analysis</h3>
                <p className="text-gray-500 mb-4">
                  Click the "Analyze Damage" button to process the image and get detailed damage assessment.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};
export default Upload;