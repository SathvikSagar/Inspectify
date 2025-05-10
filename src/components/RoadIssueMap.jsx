import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, LayersControl, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Map, Layers, X, ChevronDown, ChevronUp, Sliders, Calendar, MapPin, AlertTriangle } from 'lucide-react';

// Fix for Leaflet marker icons
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Component to handle map centering and zooming to a specific marker
const MapController = ({ center, zoom, highlightedEntryId, entries, bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  useEffect(() => {
    if (highlightedEntryId && entries.length > 0) {
      const entry = entries.find(e => e._id === highlightedEntryId);
      if (entry && entry.latitude && entry.longitude) {
        const lat = parseFloat(entry.latitude);
        const lng = parseFloat(entry.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setView([lat, lng], 16);
        }
      }
    }
  }, [highlightedEntryId, entries, map]);
  
  // Fit map to bounds when bounds change
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  
  return null;
};

// Custom control component for map
const MapSearch = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  return (
    <div className="absolute top-4 left-4 z-[1000] w-64">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="Search by location..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <button 
          type="submit"
          className="absolute right-2 top-2 bg-green-500 text-white p-0.5 rounded-md hover:bg-green-600 transition-colors"
        >
          <Map size={16} />
        </button>
      </form>
    </div>
  );
};

const RoadIssueMap = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default center
  const [mapZoom, setMapZoom] = useState(13);
  const [highlightedEntryId, setHighlightedEntryId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [activeBaseMap, setActiveBaseMap] = useState('street');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Filter states
  const [filters, setFilters] = useState({
    severity: [],
    damageType: [],
    dateRange: {
      start: null,
      end: null
    },
    status: []
  });
  
  // Get highlighted entry ID from URL query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const highlightId = queryParams.get('highlight');
    if (highlightId) {
      setHighlightedEntryId(highlightId);
    }
  }, [location.search]);

  // Fetch entries from API
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("https://inspectify-backend.onrender.com/api/road-entries");
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error("Expected an array of entries");
        }
        
        setEntries(data);
        setFilteredEntries(data);
        
        // If we have a highlighted entry, center on that one
        if (highlightedEntryId) {
          const highlightedEntry = data.find(entry => entry._id === highlightedEntryId);
          if (highlightedEntry && highlightedEntry.latitude && highlightedEntry.longitude) {
            setMapCenter([
              parseFloat(highlightedEntry.latitude),
              parseFloat(highlightedEntry.longitude)
            ]);
            setMapZoom(16); // Zoom in closer for highlighted entry
          }
        } 
        // Otherwise set map center to the first entry with valid coordinates
        else if (data.length > 0) {
          const validEntry = data.find(entry => 
            entry.latitude && entry.longitude && 
            !isNaN(parseFloat(entry.latitude)) && 
            !isNaN(parseFloat(entry.longitude))
          );
          
          if (validEntry) {
            setMapCenter([
              parseFloat(validEntry.latitude), 
              parseFloat(validEntry.longitude)
            ]);
          }
        }
        
        // Calculate map bounds based on all valid entries
        const validCoordinates = data
          .filter(entry => 
            entry.latitude && 
            entry.longitude && 
            !isNaN(parseFloat(entry.latitude)) && 
            !isNaN(parseFloat(entry.longitude))
          )
          .map(entry => [parseFloat(entry.latitude), parseFloat(entry.longitude)]);
          
        if (validCoordinates.length > 0) {
          setMapBounds(validCoordinates);
        }
      } catch (error) {
        console.error("Error fetching road entries:", error);
        setError("Failed to load map data");
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [highlightedEntryId]);
  
  // Apply filters when they change
  useEffect(() => {
    if (entries.length === 0) return;
    
    let filtered = [...entries];
    
    // Filter by severity
    if (filters.severity.length > 0) {
      filtered = filtered.filter(entry => filters.severity.includes(entry.severity));
    }
    
    // Filter by damage type
    if (filters.damageType.length > 0) {
      filtered = filtered.filter(entry => {
        if (Array.isArray(entry.damageType)) {
          return entry.damageType.some(type => filters.damageType.includes(type));
        } else {
          return filters.damageType.includes(entry.damageType);
        }
      });
    }
    
    // Filter by status
    if (filters.status.length > 0) {
      filtered = filtered.filter(entry => filters.status.includes(entry.status));
    }
    
    // Filter by date range
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        
        if (filters.dateRange.start && filters.dateRange.end) {
          return entryDate >= new Date(filters.dateRange.start) && 
                 entryDate <= new Date(filters.dateRange.end);
        } else if (filters.dateRange.start) {
          return entryDate >= new Date(filters.dateRange.start);
        } else if (filters.dateRange.end) {
          return entryDate <= new Date(filters.dateRange.end);
        }
        
        return true;
      });
    }
    
    setFilteredEntries(filtered);
    
    // Update map bounds based on filtered entries
    if (filtered.length > 0 && mapInstance) {
      const validCoordinates = filtered
        .filter(entry => 
          entry.latitude && 
          entry.longitude && 
          !isNaN(parseFloat(entry.latitude)) && 
          !isNaN(parseFloat(entry.longitude))
        )
        .map(entry => [parseFloat(entry.latitude), parseFloat(entry.longitude)]);
        
      if (validCoordinates.length > 0) {
        setMapBounds(validCoordinates);
      }
    }
  }, [filters, entries]);

  // Get color based on severity
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'low':
        return '#3498db'; // Blue
      case 'moderate':
        return '#f39c12'; // Orange
      case 'high':
        return '#e67e22'; // Dark Orange
      case 'severe':
        return '#e74c3c'; // Red
      default:
        return '#95a5a6'; // Gray for unknown
    }
  };

  // Get radius based on severity
  const getSeverityRadius = (severity) => {
    switch(severity) {
      case 'low':
        return 8;
      case 'moderate':
        return 10;
      case 'high':
        return 12;
      case 'severe':
        return 15;
      default:
        return 6;
    }
  };

  // Handle click on a marker
  const handleMarkerClick = (entryId) => {
    navigate(`/report?highlight=${entryId}`);
  };
  
  // Handle search
  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    try {
      // Use a geocoding service to convert address to coordinates
      // For this example, we'll just filter by address
      const filtered = entries.filter(entry => 
        entry.address && entry.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filtered.length > 0) {
        setFilteredEntries(filtered);
        
        // Center map on first result
        const firstResult = filtered[0];
        if (firstResult.latitude && firstResult.longitude) {
          setMapCenter([
            parseFloat(firstResult.latitude),
            parseFloat(firstResult.longitude)
          ]);
          setMapZoom(15);
        }
      } else {
        // No results found
        alert("No locations found matching your search.");
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };
  
  // Toggle filter for severity, damage type, or status
  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const current = [...prev[type]];
      const index = current.indexOf(value);
      
      if (index === -1) {
        current.push(value);
      } else {
        current.splice(index, 1);
      }
      
      return {
        ...prev,
        [type]: current
      };
    });
  };
  
  // Set date range
  const setDateRange = (start, end) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      severity: [],
      damageType: [],
      dateRange: {
        start: null,
        end: null
      },
      status: []
    });
    setFilteredEntries(entries);
  };
  
  // Extract unique damage types from entries
  const uniqueDamageTypes = useMemo(() => {
    const types = new Set();
    
    entries.forEach(entry => {
      if (Array.isArray(entry.damageType)) {
        entry.damageType.forEach(type => types.add(type));
      } else if (entry.damageType) {
        types.add(entry.damageType);
      }
    });
    
    return Array.from(types);
  }, [entries]);
  
  // Format damage type for display
  const formatDamageType = (type) => {
    if (!type) return 'Unknown';
    return type.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Count entries by severity
  const severityCounts = useMemo(() => {
    const counts = {
      low: 0,
      moderate: 0,
      high: 0,
      severe: 0,
      unknown: 0
    };
    
    entries.forEach(entry => {
      if (entry.severity) {
        counts[entry.severity] = (counts[entry.severity] || 0) + 1;
      } else {
        counts.unknown++;
      }
    });
    
    return counts;
  }, [entries]);
  
  // Count entries by status
  const statusCounts = useMemo(() => {
    const counts = {};
    
    entries.forEach(entry => {
      if (entry.status) {
        counts[entry.status] = (counts[entry.status] || 0) + 1;
      } else {
        counts.unknown = (counts.unknown || 0) + 1;
      }
    });
    
    return counts;
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading map data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-md max-w-md text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Map</h3>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
      {/* Map Container */}
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        whenCreated={setMapInstance}
      >
        <MapController 
          center={mapCenter} 
          zoom={mapZoom} 
          highlightedEntryId={highlightedEntryId}
          entries={filteredEntries}
          bounds={mapBounds}
        />
        
        <ZoomControl position="bottomright" />
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked={activeBaseMap === 'street'} name="Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                add: () => setActiveBaseMap('street')
              }}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer checked={activeBaseMap === 'satellite'} name="Satellite">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              eventHandlers={{
                add: () => setActiveBaseMap('satellite')
              }}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer checked={activeBaseMap === 'terrain'} name="Terrain">
            <TileLayer
              attribution='&copy; <a href="https://www.opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                add: () => setActiveBaseMap('terrain')
              }}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {filteredEntries.map(entry => {
          // Skip entries without valid coordinates
          if (!entry.latitude || !entry.longitude || 
              isNaN(parseFloat(entry.latitude)) || 
              isNaN(parseFloat(entry.longitude))) {
            return null;
          }
          
          const lat = parseFloat(entry.latitude);
          const lng = parseFloat(entry.longitude);
          const color = getSeverityColor(entry.severity);
          const radius = getSeverityRadius(entry.severity);
          const isHighlighted = entry._id === highlightedEntryId;
          
          return (
            <CircleMarker 
              key={entry._id}
              center={[lat, lng]}
              radius={isHighlighted ? radius * 1.5 : radius}
              pathOptions={{ 
                fillColor: color,
                fillOpacity: isHighlighted ? 0.9 : 0.8,
                color: isHighlighted ? 'yellow' : 'white',
                weight: isHighlighted ? 3 : 1
              }}
              eventHandlers={{
                click: () => handleMarkerClick(entry._id)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 text-base mb-1">
                    {Array.isArray(entry.damageType) 
                      ? entry.damageType.map(type => formatDamageType(type)).join(', ')
                      : formatDamageType(entry.damageType) || 'Unknown Issue'
                    }
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2 flex items-center">
                    <MapPin size={14} className="mr-1 text-gray-400" />
                    {entry.address || 'Location not available'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Severity</div>
                      <div className="flex items-center">
                        <span 
                          className="inline-block w-3 h-3 rounded-full mr-1"
                          style={{ backgroundColor: color }}
                        ></span>
                        <span className="text-sm font-medium capitalize">{entry.severity || 'unknown'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="text-sm font-medium">
                        {entry.status || 'Not Set'}
                      </div>
                    </div>
                  </div>
                  
                  {entry.timestamp && (
                    <div className="text-xs text-gray-500 mb-3">
                      Reported: {new Date(entry.timestamp).toLocaleDateString()}
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleMarkerClick(entry._id)}
                    className="w-full py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded transition-colors flex items-center justify-center"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Search Control */}
      <MapSearch onSearch={handleSearch} />
      
      {/* Filter Toggle Button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center bg-white px-3 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
        >
          <Filter size={16} className="mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {isFilterOpen ? (
            <ChevronUp size={16} className="ml-2 text-gray-500" />
          ) : (
            <ChevronDown size={16} className="ml-2 text-gray-500" />
          )}
        </button>
      </div>
      
      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-4 z-[1000] bg-white rounded-xl shadow-lg border border-gray-200 w-80 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <Sliders size={16} className="mr-2 text-gray-500" />
                <h3 className="font-medium text-gray-800">Advanced Filters</h3>
              </div>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Severity Filter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Severity</h4>
                <div className="space-y-2">
                  {['low', 'moderate', 'high', 'severe'].map(severity => (
                    <label key={severity} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-green-500 focus:ring-green-500 mr-2"
                        checked={filters.severity.includes(severity)}
                        onChange={() => toggleFilter('severity', severity)}
                      />
                      <span className="flex items-center text-sm text-gray-700 capitalize">
                        <span 
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: getSeverityColor(severity) }}
                        ></span>
                        {severity} ({severityCounts[severity] || 0})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Damage Type Filter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Damage Type</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {uniqueDamageTypes.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-green-500 focus:ring-green-500 mr-2"
                        checked={filters.damageType.includes(type)}
                        onChange={() => toggleFilter('damageType', type)}
                      />
                      <span className="text-sm text-gray-700">
                        {formatDamageType(type)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <div className="space-y-2">
                  {Object.keys(statusCounts).map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-green-500 focus:ring-green-500 mr-2"
                        checked={filters.status.includes(status)}
                        onChange={() => toggleFilter('status', status)}
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {status} ({statusCounts[status]})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar size={14} className="mr-1" />
                  Date Range
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">From</label>
                    <input
                      type="date"
                      className="w-full rounded border-gray-300 text-sm focus:ring-green-500 focus:border-green-500"
                      value={filters.dateRange.start || ''}
                      onChange={(e) => setDateRange(e.target.value, filters.dateRange.end)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">To</label>
                    <input
                      type="date"
                      className="w-full rounded border-gray-300 text-sm focus:ring-green-500 focus:border-green-500"
                      value={filters.dateRange.end || ''}
                      onChange={(e) => setDateRange(filters.dateRange.start, e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Filter Actions */}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Reset All
                </button>
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredEntries.length}</span> of <span className="font-medium">{entries.length}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md z-[1000] border border-gray-200">
        <h4 className="text-xs font-medium mb-2 text-gray-700">Severity Legend</h4>
        <div className="space-y-1.5">
          {[
            { level: 'Low', color: '#3498db', count: severityCounts.low },
            { level: 'Moderate', color: '#f39c12', count: severityCounts.moderate },
            { level: 'High', color: '#e67e22', count: severityCounts.high },
            { level: 'Severe', color: '#e74c3c', count: severityCounts.severe },
            { level: 'Unknown', color: '#95a5a6', count: severityCounts.unknown }
          ].map(item => (
            <div key={item.level} className="flex items-center justify-between">
              <div className="flex items-center">
                <span 
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-xs text-gray-700">{item.level}</span>
              </div>
              <span className="text-xs text-gray-500 ml-2">{item.count || 0}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Map Stats */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md z-[1000] border border-gray-200">
        <div className="text-xs text-gray-700">
          <div className="font-medium mb-1">Map Statistics</div>
          <div className="space-y-0.5">
            <div>Total Issues: <span className="font-medium">{entries.length}</span></div>
            <div>Visible: <span className="font-medium">{filteredEntries.length}</span></div>
            <div>Resolved: <span className="font-medium">{statusCounts.Resolved || 0}</span></div>
          </div>
        </div>
      </div>
      
      {/* Custom styles for Leaflet popups */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #6B7280;
          padding: 8px 8px 0 0;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #1F2937;
        }
        .leaflet-control-layers-expanded {
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default RoadIssueMap;