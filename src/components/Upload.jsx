import React, { useState, useRef, useEffect } from 'react';

const Upload = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);  // Reference to the canvas

  // Handle image file selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); // Create an image preview
    }
  };

  // Handle analysis when "Analyze Image" button is clicked
  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      // Update the API URL to the correct endpoint for image analysis
      const response = await fetch('http://localhost:5000/analyze-damage', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image analysis failed.');
      }

      const data = await response.json();
      setAnalysisResult(data);  // Save the result to display
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to draw bounding boxes on the canvas
  const drawBoundingBoxes = () => {
    if (!analysisResult || !analysisResult.detections || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const image = new Image();
    image.src = previewUrl;

    image.onload = () => {
      // Set canvas size to match the image
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      // Draw bounding boxes for each detection with red color
      analysisResult.detections.forEach((item) => {
        const [x, y, width, height] = item.bbox;  // Assuming bbox is [x, y, width, height]
        ctx.strokeStyle = 'red';  // Keep bounding boxes red
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);  // Draw the bounding box
      });
    };
  };

  // Trigger drawing bounding boxes when analysis result is available
  useEffect(() => {
    if (analysisResult) {
      drawBoundingBoxes();
    }
  }, [analysisResult]);

  return (
    <div className="image-upload-container p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-sm">
      <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Upload Image for Analysis</h1>
      
      {/* File upload input */}
      <input 
        type="file" 
        accept="image/*"
        onChange={handleImageChange}
        className="block w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
      />
      
      {/* Image preview */}
      {previewUrl && (
        <div className="relative w-full h-[400px] bg-gray-100 rounded-lg shadow-sm mb-4">
          <img 
            src={previewUrl} 
            alt="Image Preview" 
            className="w-full h-full object-contain rounded-lg"
          />
          
          {/* Canvas for bounding boxes */}
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full rounded-lg" />
        </div>
      )}
      
      {/* Analyze button */}
      <button 
        onClick={handleAnalyzeImage} 
        className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-300"
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Image'}
      </button>

      {/* Error or result display */}
      {error && <div className="mt-4 text-red-500 text-center">{error}</div>}

      {analysisResult && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Analysis details section */}
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Analysis Results</h2>
            <div className="text-gray-700">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Severity:</span>
                <span>{analysisResult.severity.level}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Count Score:</span>
                <span>{analysisResult.severity.count_score}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Area Score:</span>
                <span>{analysisResult.severity.area_score}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Type Score:</span>
                <span>{analysisResult.severity.type_score}</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800">Detected Objects:</h3>
            <ul className="space-y-2 text-gray-600">
              {analysisResult.detections.map((item, index) => (
                <li key={index} className="bg-gray-50 p-3 rounded-md shadow-sm">
                  <div className="flex justify-between">
                    <p><strong>Class:</strong> {item.class}</p>
                    <p><strong>Confidence:</strong> {item.conf}</p>
                  </div>
                  <div className="mt-1">
                    <strong>BBox:</strong> {item.bbox.join(', ')}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
