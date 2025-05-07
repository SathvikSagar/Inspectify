import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom icon (instead of relying on L.Icon.Default)
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Pulse animation for the user location
const pulseIcon = new L.DivIcon({
  className: 'pulse-icon',
  html: '<div class="pulse-marker"><div class="pulse-core"></div><div class="pulse-ring"></div></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Component to recenter the map when position changes
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
};

// Component to add map controls
const MapControls = () => {
  const map = useMap();
  
  useEffect(() => {
    // Add fullscreen control if not already present
    if (!map.fullscreenControl) {
      // This is a simple implementation - in a real app you'd use a proper fullscreen control plugin
      const fullscreenButton = L.control({ position: 'topleft' });
      fullscreenButton.onAdd = () => {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.innerHTML = '<a class="fullscreen-btn" title="View Fullscreen" href="#" style="font-size: 18px; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: white; text-decoration: none;">⤢</a>';
        
        div.onclick = (e) => {
          e.preventDefault();
          const mapContainer = map.getContainer();
          
          if (!document.fullscreenElement) {
            mapContainer.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
          } else {
            document.exitFullscreen();
          }
        };
        
        return div;
      };
      
      fullscreenButton.addTo(map);
      map.fullscreenControl = fullscreenButton;
    }
  }, [map]);
  
  return null;
};

const UserLocationMap = () => {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        setPosition({
          lat,
          lng,
        });
        
        // Get address from coordinates
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          setAddress(data.display_name);
        } catch (err) {
          console.error("Failed to fetch address:", err);
        }
        
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching location:", err);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="relative h-96 w-full rounded-xl overflow-hidden z-0 shadow-lg border border-gray-200">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-3 text-gray-600">Loading your location...</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white to-transparent p-4 pointer-events-none">
        <div className="flex items-center">
          <div className="bg-blue-500 rounded-full p-2 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Your Current Location</h3>
            {position && (
              <p className="text-xs text-gray-500 truncate max-w-xs">{address || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`}</p>
            )}
          </div>
        </div>
      </div>
      
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {position && (
          <>
            <RecenterMap lat={position.lat} lng={position.lng} />
            <MapControls />
            
            {/* Accuracy circle */}
            <Circle 
              center={[position.lat, position.lng]} 
              radius={100}
              pathOptions={{ 
                fillColor: '#3b82f6', 
                fillOpacity: 0.1, 
                color: '#3b82f6', 
                weight: 1 
              }}
            />
            
            {/* Pulse marker */}
            <Marker position={[position.lat, position.lng]} icon={pulseIcon}>
              <Popup className="custom-popup">
                <div className="p-1">
                  <h3 className="font-bold text-blue-600">Your Location</h3>
                  <p className="text-sm text-gray-600">{address || "Current position"}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
            
            {/* Standard marker */}
            <Marker position={[position.lat, position.lng]} icon={customIcon} />
          </>
        )}
      </MapContainer>
      
      {/* Map controls overlay */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-2">
        <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default UserLocationMap;
