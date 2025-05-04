import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthorityPage = () => {
  const [roadData, setRoadData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ address: '', date: '' });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  const navigate = useNavigate();

  const fetchRoadData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/road-data');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setRoadData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Error fetching road data:', error);
      setError('Could not fetch road data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadData();
  }, []);

  // Handle Predict click
  const handlePredictClick = (item) => {
    navigate('/upload', {
      state: {
        imagePath: item.imagePath,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
      },
    });
  };

  // Filter logic
  useEffect(() => {
    let updated = [...roadData];

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

    // Sorting logic
    if (sortConfig.key) {
      updated.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'timestamp') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(updated);
  }, [filters, sortConfig, roadData]);

  // Handle sort
  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 p-8">
      {/* Navbar */}
      <nav className="bg-white shadow-md rounded-xl p-6 mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">🛣️ Authority Dashboard</h1>
        <p className="text-gray-500 text-lg">Review and act on road damage reports</p>
      </nav>

      {/* Filters */}
      <div className="max-w-6xl mx-auto mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Filter by address"
          className="p-3 border rounded-xl shadow-sm"
          value={filters.address}
          onChange={(e) => setFilters({ ...filters, address: e.target.value })}
        />
        <input
          type="date"
          className="p-3 border rounded-xl shadow-sm"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
      </div>

      {loading && <p className="text-center text-blue-600">Loading road data...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && filteredData.length > 0 ? (
        <div className="max-w-6xl mx-auto overflow-x-auto shadow-lg rounded-xl border border-gray-200">
          <table className="min-w-full table-auto bg-white rounded-xl">
            <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 text-left">Image</th>
                <th className="px-6 py-4 text-left cursor-pointer" onClick={() => toggleSort('address')}>
                  Location {sortConfig.key === 'address' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="px-6 py-4 text-left cursor-pointer" onClick={() => toggleSort('timestamp')}>
                  Timestamp {sortConfig.key === 'timestamp' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="px-6 py-4 text-left">Latitude</th>
                <th className="px-6 py-4 text-left">Longitude</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4">
                    <img
                      src={`http://localhost:5000/${item.imagePath}`}
                      alt="Road"
                      className="w-24 h-16 object-cover rounded-md shadow-md border cursor-pointer"
                      onClick={() => handlePredictClick(item)}
                    />
                  </td>
                  <td className="px-6 py-4">{item.address || 'N/A'}</td>
                  <td className="px-6 py-4">{new Date(item.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">{item.latitude}</td>
                  <td className="px-6 py-4">{item.longitude}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handlePredictClick(item)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-full"
                    >
                      Predict
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && <p className="text-center text-gray-600">No road data found.</p>}
    </div>
  );
};

export default AuthorityPage;
