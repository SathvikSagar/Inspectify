import React, { useEffect, useRef, useState } from "react";

const Camera = () => {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // Get available video input devices (cameras)
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceInfos.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);

        // Set default selected device
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error fetching devices:", err);
      }
    };

    fetchDevices();
  }, []);

  const startCamera = async () => {
    if (!selectedDeviceId) return;

    try {
      const constraints = {
        video: { deviceId: { exact: selectedDeviceId } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-xl font-semibold">Select Camera</h2>

      <select
        value={selectedDeviceId}
        onChange={(e) => setSelectedDeviceId(e.target.value)}
        className="border rounded px-3 py-2"
      >
        {devices.map((device, idx) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${idx + 1}`}
          </option>
        ))}
      </select>

      <button
        onClick={startCamera}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow"
      >
        Start Camera
      </button>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="mt-4 w-full max-w-md rounded shadow"
      />
    </div>
  );
};

export default Camera;
