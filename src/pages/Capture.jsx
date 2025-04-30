import { useState } from "react";

const Capture = ({ setLocation }) => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
                setLocation({ lat, lon });

                // Convert lat/lon to an address using OpenStreetMap
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
                    );
                    const data = await response.json();
                    setLocation({ lat, lon, address: data.display_name });
                } catch (err) {
                    setError("Failed to fetch address.");
                }
                setLoading(false);
            },
            (err) => {
                setError("Location access denied. Please enable location services.");
                setLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="p-4 border rounded-md shadow-md">
            <h2 className="text-lg font-bold mb-2">Step 1: Enable Location</h2>
            <button
                onClick={getLocation}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                disabled={loading}
            >
                {loading ? "Fetching location..." : "Enable Location"}
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
};

export default Capture;
