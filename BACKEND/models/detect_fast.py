from ultralytics import YOLO 
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import sys
import os
import json
import time

# Enable faster CPU operations if available
torch.set_num_threads(8)  # Increased thread count for better performance
torch.backends.cudnn.benchmark = True
torch.backends.cudnn.deterministic = False  # Faster but less deterministic
torch.backends.cudnn.enabled = True

# Start timing
start_time = time.time()

# ======= Load YOLO model =======
model_path = r'C:\Users\USER\tailwindsample\BACKEND\models\best.pt'
yolo_model = YOLO(model_path)
# Set YOLO to use half precision for faster inference if GPU is available
yolo_model.model.half() if torch.cuda.is_available() else yolo_model.model.float()

# ======= Load ViT model =======
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Skip ViT model loading for faster execution
print(f"Models loaded in {time.time() - start_time:.2f} seconds")

def get_class_color(cls_name):
    if cls_name in ["pothole", "alligator crack"]:
        return [255, 0, 0]  # Red
    elif cls_name in ["longitudinal crack", "lateral crack"]:
        return [0, 0, 139]  # Dark Blue
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

def run_detection(image_path, location=None):
    detection_start = time.time()
    try:
        # Load image once and reuse
        image = Image.open(image_path)
    except Exception as e:
        return {"error": f"Error loading image: {e}"}

    img_width, img_height = image.size
    
    # YOLO Detection with extremely optimized parameters for speed
    yolo_start = time.time()
    results = yolo_model.predict(
        source=image_path,
        save=False,
        verbose=False,
        conf=0.6,  # Higher confidence threshold for fewer detections
        iou=0.7,   # Much higher NMS threshold for much faster processing
        max_det=10,  # Significantly reduced maximum detections for faster processing
        half=True,  # Always use half precision for speed
        device=0 if torch.cuda.is_available() else 'cpu',  # Use GPU if available
        imgsz=320,  # Smaller image size for much faster processing
        augment=False,  # No augmentation for faster processing
        agnostic_nms=True  # Faster NMS
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
    
    # Skip ViT prediction for speed
    vit_predictions = []

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

    print(f"Total detection completed in {time.time() - detection_start:.2f} seconds")
    return result_json

# ======= Script Entry =======
if __name__ == "__main__":
    script_start = time.time()
    
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python detect.py <image_path> [latitude] [longitude]"}))
        sys.exit(1)

    image_path = sys.argv[1]
    latitude = float(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2] else None
    longitude = float(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else None

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file {image_path} not found."}))
        sys.exit(1)

    location = {"latitude": latitude, "longitude": longitude}
    
    # Run detection
    result = run_detection(image_path, location=location)
    
    # Add total script time
    result["total_script_time"] = round(time.time() - script_start, 2)
    print(f"Total script execution time: {result['total_script_time']} seconds")
    
    # Return result as JSON
    print(json.dumps(result))