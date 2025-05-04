import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BeatLoader } from 'react-spinners';

const Upload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { imagePath, latitude, longitude, address: initialAddress } = location.state || {};

  const [address, setAddress] = useState(initialAddress || 'Fetching...');
  const [lat, setLat] = useState(latitude || null);
  const [lng, setLng] = useState(longitude || null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (imagePath) {
      setPreviewUrl(`http://localhost:5000/${imagePath}`);
    }
  }, [imagePath]);

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

    try {
      const response = await fetch(`http://localhost:5000/${imagePath}`);
      if (!response.ok) throw new Error('Failed to fetch image');
      const imageBlob = await response.blob();

      const formData = new FormData();
      formData.append('image', imageBlob, 'image.jpg');
      formData.append('latitude', lat?.toString() || '');
      formData.append('longitude', lng?.toString() || '');

      const analyzeResponse = await fetch('http://localhost:5000/analyze-damage', {
        method: 'POST',
        body: formData,
      });

      if (!analyzeResponse.ok) throw new Error('Image analysis failed.');
      const data = await analyzeResponse.json();
      setAnalysisResult(data);

      if (data.latitude && data.longitude) {
        setLat(data.latitude);
        setLng(data.longitude);
        fetchAddress(data.latitude, data.longitude);
      }

      await saveAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysisResult = async (result) => {
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL();

      const saveResponse = await fetch('http://localhost:5000/save-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          latitude: lat,
          longitude: lng,
          analysisResult: result,
          address: address,
        }),
      });

      if (!saveResponse.ok) throw new Error('Failed to save analysis result.');
    } catch {
      setError('Failed to save the analysis result.');
    }
  };

  const drawBoundingBoxes = () => {
    if (!analysisResult?.detections || !canvasRef.current || !previewUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = previewUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      analysisResult.detections.forEach((item) => {
        const [x, y, width, height] = item.bbox;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
      });
    };
  };

  useEffect(() => {
    if (analysisResult && previewUrl) {
      drawBoundingBoxes();
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

  const Sidebar = () => (
    <div className="w-64 h-screen bg-white-800 text-black flex flex-col p-4 space-y-4 fixed left-0 top-20">
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <button onClick={() => navigate('/authority')} className="text-left hover:bg-green-800 p-2 rounded">🏠 Home</button>
      <button onClick={() => navigate('/analytics')} className="text-left hover:bg-green-800 p-2 rounded">📊 Analytics</button>
      <button onClick={() => navigate('/status')} className="text-left hover:bg-green-800 p-2 rounded">⚙️ Set Status</button>
      <button onClick={() => navigate('/report')} className="text-left hover:bg-green-800 p-2 rounded">📄 See Reports</button>
      <button onClick={() => navigate('/login')} className="text-left hover:bg-red-00 p-2 rounded">🚪 Sign Out</button>
    </div>
  );

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Analyze Image</h1>

        {previewUrl && (
          <div className="relative w-full h-[400px] bg-gray-100 rounded-lg shadow-sm mb-4">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full rounded-lg pointer-events-none" />
          </div>
        )}

        <button
          onClick={handleAnalyzeImage}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
          disabled={loading}
        >
          {loading ? (
            <div className="flex justify-center items-center">
              <BeatLoader color="#fff" size={10} />
              <span className="ml-2">Analyzing...</span>
            </div>
          ) : (
            'Analyze Image'
          )}
        </button>

        {error && <div className="mt-4 text-red-500 text-center">{error}</div>}

        {analysisResult && (
          <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Road Damage Report</h2>

            <p><strong>Address:</strong> {address}</p>
            <p><strong>Coordinates:</strong> {lat}, {lng}</p>
            <p><strong>Timestamp:</strong> {new Date(analysisResult.timestamp || Date.now()).toLocaleString()}</p>

            <p className="mt-4 font-medium">Detected Damage Types:</p>
            <ul className="list-disc ml-6 text-gray-700">
              {(analysisResult.vit_predictions || []).map((type, i) => (
                <li key={i}>{type}</li>
              ))}
            </ul>

            <p className="mt-4"><strong>Severity:</strong> {analysisResult.severity?.level || 'N/A'}</p>
            <p><strong>Damage Coverage:</strong> {analysisResult.severity?.area_score ? `${analysisResult.severity.area_score.toFixed(1)}%` : 'N/A'}</p>
            <p className="mt-2">
              <strong>Repair Priority:</strong>{' '}
              {['High', 'Severe'].includes(analysisResult.severity?.level)
                ? 'Immediate action recommended.'
                : 'Can be scheduled.'}
            </p>

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setShowMap(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                📍 View on Map
              </button>
              <button
                onClick={() => navigate('/report')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                📄 See All Reports
              </button>
            </div>

            {showMap && lat && lng && (
              <div className="mt-6 h-[400px]">
                <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <Marker
                    position={[lat, lng]}
                    icon={createCustomIcon(getMarkerColor(analysisResult.severity?.level))}
                  >
                    <Popup>{address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
