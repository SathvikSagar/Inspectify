import { useEffect, useState, useRef } from "react";
import { FaHome, FaCamera, FaClock, FaSave, FaAddressCard, FaSign, FaSignOutAlt } from "react-icons/fa"; 
import axios from "axios";
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
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Location
  const [location, setLocation] = useState(null);
  const [hasFetchedLocation, setHasFetchedLocation] = useState(false);

  // Image & Prediction
  const [selectedFile, setSelectedFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Camera
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Saved Data
  const [savedImages, setSavedImages] = useState([]);

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

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("latitude", location.lat);
    formData.append("longitude", location.lon);
    formData.append("address", location.address);

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
      const response = await axios.get("http://localhost:5000/saved");
      setSavedImages(response.data);
    } catch (error) {
      console.error("Failed to fetch saved images:", error);
    }
  };

  // 🧠 Trigger when entering Saved tab
  useEffect(() => {
    if (activeTab === "Saved") {
      loadSavedImages();
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white p-5 shadow-lg">
        <ul>
          {["Dashboard", "Camera", "History", "Saved","Logout"].map((tab) => (
            <li
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError("");
                setPrediction(null);
                if (tab !== "Camera") setStreamActive(false);
              }}
              className={`p-3 cursor-pointer flex items-center gap-2 rounded-lg mb-2 transition-all ${
                activeTab === tab ? "bg-green-800 text-white" : "hover:bg-gray-200"
              }`}
            >
              {tab === "Dashboard" && <FaHome />}
              {tab === "Camera" && <FaCamera />}
              {tab === "History" && <FaClock />}
              {tab === "Saved" && <FaSave />}
              {tab==="Logout" && <FaSignOutAlt />}
              {tab}
            </li>
          ))}
        </ul>
      </div>

      {activeTab === "Camera" && (
  <div className="flex-1 bg-white p-8 rounded-2xl shadow-lg overflow-y-auto text-gray-800 transition-all duration-300">
    <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
       Camera & Image Prediction
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Camera Section */}
      <div className="space-y-6">
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow h-72 flex items-center justify-center bg-gray-50">
          {streamActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <p className="text-gray-400 text-lg">Camera preview will appear here</p>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStreamActive((prev) => !prev)}
            className="w-full py-2 px-4 text-white font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 transition"
          >
            {streamActive ? "Stop Camera" : "Start Camera"}
          </button>

          {streamActive && (
            <button
              onClick={captureImage}
              className="w-full py-2 px-4 text-white font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 transition"
            >
              Capture Image
            </button>
          )}
        </div>
      </div>

      {/* Upload & Info Section */}
      <div className="space-y-6">
        {/* Location Info */}
        <div className="bg-gray-100 p-5 rounded-xl border border-gray-300 shadow-sm">
          <h4 className="text-lg font-semibold mb-2">📍 Location Info</h4>
          {loading ? (
            <p className="text-gray-500 italic">Fetching location...</p>
          ) : location ? (
            <div className="text-sm space-y-1 text-gray-700">
              <p><strong>Address:</strong> {location.address}</p>
              <p><strong>Lat:</strong> {location.lat} | <strong>Lon:</strong> {location.lon}</p>
            </div>
          ) : (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition"
          />
        </div>

        {/* Image Preview */}
        {selectedFile && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Preview:</label>
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="rounded-xl border border-gray-300 shadow w-full max-w-sm"
            />
          </div>
        )}

        {/* Predict Button */}
        <button
          onClick={handleUpload}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
        >
          Predict
        </button>

        {/* Prediction Output */}
        {loading && <p className="text-gray-500 italic">Processing image...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {prediction && (
          <div
            className={`mt-4 p-4 rounded-xl border-l-4 ${
              prediction.label === "road"
                ? "bg-green-50 border-green-600 text-green-800"
                : "bg-red-50 border-red-600 text-red-800"
            }`}
          >
            <p className="text-lg font-semibold">Prediction: {prediction.label}</p>
            {prediction.label === "road" && (
              <p>
                ✅ This image has been <strong>{prediction.saved ? "saved" : "not saved"}</strong> to the database.
              </p>
            )}
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
      <div className="bg-blue-400 text-white rounded-2xl p-5 shadow-md">
        <h2 className="text-xl font-bold mb-1">No of Sanctioned Roads</h2>
        <p className="text-sm">Area: </p>
        <div className="flex justify-between items-center mt-2">
          <span className="font-semibold">12</span>
          <span className="bg-white text-blue-500 px-3 py-1 rounded-full text-sm">View</span>
        </div>
      </div>

      <div className="bg-purple-400 text-white rounded-2xl p-5 shadow-md">
        <h2 className="text-xl font-bold mb-1">No of pending roads</h2>
        <p className="text-sm">Area:</p>
        <div className="flex justify-between items-center mt-2">
          <span className="font-semibold">10</span>
          <span className="bg-white text-purple-500 px-3 py-1 rounded-full text-sm">View</span>
        </div>
      </div>

      <div className="bg-yellow-300 text-yellow-900 rounded-2xl p-5 shadow-md">
        <h2 className="text-xl font-bold mb-1">No of Repaired Roads</h2>
        <p className="text-sm">Area:</p>
        <div className="flex justify-between items-center mt-2">
          <span className="font-semibold">20</span>
          <span className="bg-white text-yellow-700 px-3 py-1 rounded-full text-sm">View</span>
        </div>
      </div>
    </div>

    {/* Camera & Chart Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Live Camera */}
      <div className="bg-white rounded-2xl p-5 shadow-md">
        <h2 className="text-xl font-bold mb-4">Live Map:</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden">
              {/* Live camera image placeholder */}
            </div>
          ))}
        </div>
      </div>

      {/* Chart Instead of Analysis */}
      <div className="bg-white rounded-2xl p-5 shadow-md">
        <h2 className="text-xl font-bold mb-4">Road Report (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { day: 'Mon', sanctioned: 2, pending: 1 },
              { day: 'Tue', sanctioned: 1, pending: 2 },
              { day: 'Wed', sanctioned: 3, pending: 1 },
              { day: 'Thu', sanctioned: 2, pending: 3 },
              { day: 'Fri', sanctioned: 1, pending: 1 },
              { day: 'Sat', sanctioned: 2, pending: 0 },
              { day: 'Sun', sanctioned: 1, pending: 2 },
            ]}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sanctioned" fill="#3b82f6" />
            <Bar dataKey="pending" fill="#facc15" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}
     


{activeTab === "History" && (
  <div className="flex-1 p-6 bg-white animate-fadeIn overflow-y-auto">
    <h2 className="text-3xl font-bold mb-6"> History</h2>
    <p className="text-gray-700">Here you can see all your images and predictions.</p>
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
