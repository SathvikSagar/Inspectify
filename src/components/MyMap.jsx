import React, { useEffect, useState } from "react";

const LiveMap = () => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Get user location via browser
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
      },
      (err) => {
        console.error("Error getting location", err);
        // Default to a known city (e.g., Delhi) if denied
        setLocation({ lat: 28.6139, lng: 77.2090 });
      }
    );
  }, []);

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-md">
      {location ? (
        <iframe
          title="User Location Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps/embed/v1/view?key=YOUR_GOOGLE_MAPS_API_KEY&center=${location.lat},${location.lng}&zoom=14&maptype=roadmap`}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-600">
          Getting your location...
        </div>
      )}
    </div>
  );
};

export default LiveMap;
