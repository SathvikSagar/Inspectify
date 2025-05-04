import React, { useEffect, useState } from "react";
import axios from "axios";

const Report = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/road-entries");
        setEntries(res.data);
      } catch (error) {
        setError("Failed to fetch road entries. Please try again.");
        console.error("Error fetching road entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Detection Reports</h1>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-500">No entries found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map((entry, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden p-4">
              <img
                src={`http://localhost:5000/${entry.imagePath}`}
                alt={`Detected road ${index}`}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <div className="text-gray-700">
                <p><strong>Latitude:</strong> {entry.latitude}</p>
                <p><strong>Longitude:</strong> {entry.longitude}</p>
                <p><strong>Address:</strong> {entry.address}</p>
                <p><strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}</p>
              </div>

              <div className="mt-4 bg-gray-50 p-3 rounded-lg border">
                <p className="font-semibold text-gray-800 mb-1">📋 Summary Report:</p>
                <p className="text-sm text-gray-600">
                  This image was automatically classified as a road surface. Based on the detection
                  time and location, this area will be reviewed for potential road damage. No further
                  damage classification was triggered at the time of detection.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Report;
