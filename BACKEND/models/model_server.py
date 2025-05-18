from flask import Flask, request, jsonify
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import os
import json
import timm
import time
from ultralytics import YOLO
import io
import base64
import threading
import queue
import multiprocessing
from concurrent.futures import ThreadPoolExecutor

# Set number of threads for better performance
num_cpu = multiprocessing.cpu_count()
torch.set_num_threads(num_cpu - 1)  # Leave one CPU for the server

# Enable optimizations for faster inference
torch.backends.cudnn.benchmark = True
torch.backends.cudnn.enabled = True
torch.backends.cudnn.deterministic = False  # Faster but less deterministic
# Disable gradient computation for inference
torch.set_grad_enabled(False)

# Create a thread pool for parallel processing
executor = ThreadPoolExecutor(max_workers=num_cpu)

# Create a request queue for better handling of concurrent requests
request_queue = queue.Queue(maxsize=10)  # Limit queue size to prevent memory issues

app = Flask(__name__)

# Global variables to store models
yolo_model = None
vit_model = None
vit_transform = None
vit_labels = ["pothole", "longitudinal_crack", "lateral_crack", "alligator_crack"]
vit_thresholds_tensor = None

# Custom thresholds for ViT predictions
best_thresholds = {
    "pothole": 0.01,
    "longitudinal_crack": 0.3,  # Lowered threshold for better sensitivity
    "lateral_crack": 0.3,       # Lowered threshold for better sensitivity
    "alligator_crack": 0.01
}

def get_class_color(cls_name):
    # Normalize class name (handle both formats with spaces and underscores)
    normalized_name = cls_name.replace("_", " ").lower()
    
    if "pothole" in normalized_name:
        return [255, 0, 0]  # Red for potholes
    elif "longitudinal" in normalized_name:
        return [0, 0, 255]  # Blue for longitudinal cracks
    elif "lateral" in normalized_name:
        return [255, 165, 0]  # Orange for lateral cracks
    elif "alligator" in normalized_name:
        return [128, 0, 128]  # Purple for alligator cracks
    
    # Default color for any unrecognized damage type
    return [0, 255, 0]  # Green

def get_severity(bboxes, img_width, img_height):
    count_score = len(bboxes)
    area_score = sum([box['rel_area'] for box in bboxes])
    type_score = len(set([box['class'] for box in bboxes]))

    severity = "low"
    if count_score > 5 or area_score > 15 or type_score > 2:
        severity = "moderate"
    if count_score > 10 or area_score > 30:
        severity = "high"
    if count_score > 15 or area_score > 50:
        severity = "severe"
    return severity, count_score, area_score, type_score

def calculate_iou(box1, box2):
    """Calculate IoU between two boxes."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_area = max(0, x2 - x1) * max(0, y2 - y1)
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = box1_area + box2_area - inter_area

    if union_area == 0:
        return 0
    return inter_area / union_area

def merge_boxes(bboxes, iou_threshold=0.5):
    """Merge overlapping boxes of same class using IoU."""
    merged = []
    used = [False] * len(bboxes)

    for i in range(len(bboxes)):
        if used[i]:
            continue
        box_a = bboxes[i]
        group = [box_a]
        used[i] = True

        for j in range(i + 1, len(bboxes)):
            if used[j]:
                continue
            box_b = bboxes[j]
            if box_a["class"] == box_b["class"]:
                iou = calculate_iou(box_a["bbox"], box_b["bbox"])
                if iou >= iou_threshold:
                    group.append(box_b)
                    used[j] = True

        # Merge group to one box (bounding union)
        x1 = min([b["bbox"][0] for b in group])
        y1 = min([b["bbox"][1] for b in group])
        x2 = max([b["bbox"][2] for b in group])
        y2 = max([b["bbox"][3] for b in group])
        conf = max([b["conf"] for b in group])  # Keep max confidence
        cls_name = box_a["class"]
        color = box_a["color"]

        merged.append({
            "bbox": [x1, y1, x2, y2],
            "class": cls_name,
            "conf": round(conf, 2),
            "color": color
        })

    return merged

def run_vit_prediction(image):
    """Highly optimized ViT prediction function for maximum speed"""
    global vit_model, vit_transform, vit_thresholds_tensor
    
    # Convert to RGB if not already - use faster conversion
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    # Resize image directly for faster processing
    image_resized = image.resize((224, 224), Image.NEAREST)
    
    # Preprocess image - directly to half precision for speed
    input_tensor = vit_transform(image_resized).unsqueeze(0).to(device)
    input_tensor = input_tensor.half()  # Always use half precision for speed

    # Run inference with maximum optimizations
    with torch.no_grad():
        output = vit_model(input_tensor).squeeze()

    # Fast comparison and conversion
    predicted = (output > vit_thresholds_tensor).int().cpu().numpy()
    
    # Use list comprehension for speed
    predictions = [vit_labels[i] for i in range(len(vit_labels)) if predicted[i]]
    return predictions

def run_detection(image, location=None):
    """Run detection on an already loaded image"""
    global yolo_model
    
    detection_start = time.time()
    img_width, img_height = image.size
    
    # Save image to a temporary file for YOLO
    temp_path = "temp_image.jpg"
    image.save(temp_path)
    
    # YOLO Detection with speed-optimized parameters
    yolo_start = time.time()
    results = yolo_model.predict(
        source=temp_path,
        save=False,
        verbose=False,
        conf=0.45,  # Slightly lower confidence threshold
        iou=0.4,    # Slightly lower IoU threshold
        max_det=30,  # Reduced max detections for speed
        half=True,   # Always use half precision for speed
        device=0 if torch.cuda.is_available() else 'cpu',  # Use GPU if available
        imgsz=576,   # Slightly smaller image size for faster processing
        augment=False  # Disable augmentation for speed
    )
    print(f"YOLO inference completed in {time.time() - yolo_start:.2f} seconds")

    # Process detections efficiently
    result = results[0]
    bboxes = []
    
    # Batch process boxes for efficiency
    if len(result.boxes) > 0:
        # Get all confidences at once
        confs = [float(box.conf[0].item()) for box in result.boxes]
        # Filter by confidence threshold
        valid_indices = [i for i, conf in enumerate(confs) if conf >= 0.01]
        
        for i in valid_indices:
            box = result.boxes[i]
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            cls_id = int(box.cls[0].item())
            cls_name = result.names[cls_id]

            # Calculate area metrics
            width = x2 - x1
            height = y2 - y1
            area = width * height
            rel_area = area / (img_width * img_height) * 100

            bboxes.append({
                "bbox": [x1, y1, x2, y2],
                "class": cls_name,
                "conf": round(confs[i], 2),
                "area": round(area, 1),
                "rel_area": round(rel_area, 2),
                "color": get_class_color(cls_name)
            })

    # Calculate severity
    severity, count_score, area_score, type_score = get_severity(bboxes, img_width, img_height)
    
    # Run ViT prediction using the already loaded image
    vit_start = time.time()
    vit_predictions = run_vit_prediction(image)
    print(f"ViT inference completed in {time.time() - vit_start:.2f} seconds")

    # Prepare result JSON
    result_json = {
        "detections": bboxes,
        "severity": {
            "level": severity,
            "count_score": count_score,
            "area_score": area_score,
            "type_score": type_score
        },
        "vit_predictions": vit_predictions,
        "image_dimensions": [img_width, img_height],
        "latitude": location.get("latitude") if location else None,
        "longitude": location.get("longitude") if location else None,
        "processing_time": round(time.time() - detection_start, 2)
    }

    # Clean up temporary file
    try:
        os.remove(temp_path)
    except:
        pass

    print(f"Total detection completed in {time.time() - detection_start:.2f} seconds")
    return result_json

@app.route('/api/detect', methods=['POST'])
def detect():
    """API endpoint for detection"""
    start_time = time.time()
    
    # Get image from request
    if 'image' not in request.files and 'image' not in request.form:
        return jsonify({"error": "No image provided"}), 400
    
    # Get location data if provided
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    location = None
    if latitude and longitude:
        try:
            location = {
                "latitude": float(latitude),
                "longitude": float(longitude)
            }
        except:
            pass
    
    # Process image from file or base64
    try:
        if 'image' in request.files:
            # Image is uploaded as a file
            image_file = request.files['image']
            image = Image.open(image_file)
        else:
            # Image is provided as base64
            image_data = request.form['image']
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            image = Image.open(io.BytesIO(base64.b64decode(image_data)))
        
        # Convert to RGB immediately to avoid later conversions
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Resize very large images for faster processing
        if max(image.size) > 1920:
            scale = 1920 / max(image.size)
            new_size = (int(image.size[0] * scale), int(image.size[1] * scale))
            image = image.resize(new_size, Image.BILINEAR)
    except Exception as e:
        return jsonify({"error": f"Error processing image: {str(e)}"}), 400
    
    # Run detection
    result = run_detection(image, location=location)
    
    # Add total script time
    result["total_script_time"] = round(time.time() - start_time, 2)
    print(f"Total API execution time: {result['total_script_time']} seconds")
    
    return jsonify(result)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "models_loaded": yolo_model is not None and vit_model is not None})

def load_models():
    """Load all models into memory"""
    global yolo_model, vit_model, vit_transform, vit_thresholds_tensor, device
    
    print("Loading models...")
    start_time = time.time()
    
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Load YOLO model
    model_path = r'C:\Users\USER\tailwindsample\BACKEND\models\best.pt'
    yolo_model = YOLO(model_path)
    # Always use half precision for faster inference
    yolo_model.model.half()
    
    # Load ViT model
    vit_model = timm.create_model('deit_tiny_patch16_224', pretrained=False, scriptable=True)
    vit_model.head = nn.Sequential(
        nn.Linear(vit_model.head.in_features, 4),
        nn.Sigmoid()
    )
    vit_model.load_state_dict(torch.load(r'C:\Users\USER\tailwindsample\BACKEND\models\best_vit_multi_label.pth', map_location=device))
    vit_model.to(device)
    vit_model.eval()
    
    # Always use half precision for speed
    vit_model = vit_model.half()
    
    # Transform for ViT - highly optimized for speed
    vit_transform = transforms.Compose([
        # Resize is now done directly on PIL image for speed
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
    ])
    
    # Pre-compute thresholds tensor for faster inference
    vit_thresholds_tensor = torch.tensor([best_thresholds[label] for label in vit_labels], 
                                        device=device, dtype=torch.float16)
    
    print(f"Models loaded in {time.time() - start_time:.2f} seconds")

# Add a route to warm up the models
@app.route('/api/warmup', methods=['GET'])
def warmup():
    """Warm up the models with a dummy inference"""
    try:
        # Create a dummy image (black square)
        dummy_image = Image.new('RGB', (640, 640), color='black')
        
        # Run detection on the dummy image
        start_time = time.time()
        _ = run_detection(dummy_image)
        
        return jsonify({
            "status": "ok", 
            "message": "Models warmed up successfully",
            "warmup_time": round(time.time() - start_time, 2)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Add a route to get model information
@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded models"""
    global yolo_model, vit_model
    
    try:
        yolo_info = {
            "name": "YOLO",
            "type": str(type(yolo_model)),
            "device": str(next(yolo_model.model.parameters()).device),
            "precision": "FP16" if next(yolo_model.model.parameters()).dtype == torch.float16 else "FP32"
        }
        
        vit_info = {
            "name": "ViT",
            "type": str(type(vit_model)),
            "device": str(next(vit_model.parameters()).device),
            "precision": "FP16" if next(vit_model.parameters()).dtype == torch.float16 else "FP32"
        }
        
        system_info = {
            "torch_version": torch.__version__,
            "cuda_available": torch.cuda.is_available(),
            "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
            "cpu_count": num_cpu,
            "torch_threads": torch.get_num_threads()
        }
        
        return jsonify({
            "status": "ok",
            "models": {
                "yolo": yolo_info,
                "vit": vit_info
            },
            "system": system_info,
            "uptime": round(time.time() - server_start_time, 2)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Record server start time
    server_start_time = time.time()
    
    # Load models before starting the server
    load_models()
    
    print("Warming up models with a dummy inference...")
    # Create a dummy image (black square)
    dummy_image = Image.new('RGB', (640, 640), color='black')
    # Run detection on the dummy image
    _ = run_detection(dummy_image)
    print("Models warmed up successfully!")
    
    # Start the Flask server on port 5001 to avoid conflicts with the Express server
    app.run(host='0.0.0.0', port=5001, threaded=True)