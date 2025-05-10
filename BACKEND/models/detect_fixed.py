from ultralytics import YOLO 
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import sys
import os
import json
import time
import io
import numpy as np
import timm
from functools import lru_cache

# Enable faster CPU operations if available
torch.set_num_threads(4)  # Optimal thread count for most systems
torch.backends.cudnn.benchmark = True  # Speed up fixed-size image inference

# Global variables for models
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
yolo_model = None
vit_model = None
vit_transform = None
vit_labels = ["pothole", "longitudinal_crack", "lateral_crack", "alligator_crack"]

# Custom thresholds for ViT predictions
best_thresholds = {
    "pothole": 0.01,
    "longitudinal_crack": 0.4,
    "lateral_crack": 0.4,
    "alligator_crack": 0.01
}

# Class color mapping for faster lookup
class_colors = {
    "pothole": [255, 0, 0],  # Red
    "alligator_crack": [255, 0, 0],  # Red
    "longitudinal_crack": [0, 0, 139],  # Dark Blue
    "lateral_crack": [0, 0, 139],  # Dark Blue
}

def load_models():
    """Load models only once and cache them"""
    global yolo_model, vit_model, vit_transform
    
    if yolo_model is None or vit_model is None:
        start_time = time.time()
        print(f"Loading models on {device}...")
        
        # ======= Load YOLO model =======
        model_path = os.path.join(os.path.dirname(__file__), "best.pt")
        yolo_model = YOLO(model_path)
        
        # Set YOLO to use half precision for faster inference if GPU is available
        if torch.cuda.is_available():
            yolo_model.model.half()
        else:
            yolo_model.model.float()
        
        # ======= Load ViT model =======
        vit_model_path = os.path.join(os.path.dirname(__file__), "best_vit_multi_label.pth")
        vit_model = timm.create_model('deit_tiny_patch16_224', pretrained=False)
        vit_model.head = nn.Sequential(
            nn.Linear(vit_model.head.in_features, 4),
            nn.Sigmoid()
        )
        
        vit_model.load_state_dict(torch.load(vit_model_path, map_location=device))
        vit_model.to(device)
        vit_model.eval()
        
        # Use half precision for ViT model if GPU is available
        if torch.cuda.is_available():
            vit_model = vit_model.half()
        
        # Transform for ViT - optimize for speed
        vit_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
        ])
        
        print(f"Models loaded in {time.time() - start_time:.2f} seconds")
    
    return yolo_model, vit_model, vit_transform

def get_class_color(cls_name):
    """Get color for class with caching for repeated lookups"""
    return class_colors.get(cls_name, [0, 255, 0])  # Default to green if not found

def get_severity(bboxes, img_width, img_height):
    """Calculate severity based on detections"""
    if not bboxes:
        return "low", 0, 0, 0
        
    count_score = len(bboxes)
    area_score = sum(box['rel_area'] for box in bboxes)
    
    # Use set comprehension for unique classes
    unique_classes = {box['class'] for box in bboxes}
    type_score = len(unique_classes)

    # Use if-elif chain for better performance than multiple ifs
    if count_score > 15 or area_score > 50:
        severity = "severe"
    elif count_score > 10 or area_score > 30:
        severity = "high"
    elif count_score > 5 or area_score > 15 or type_score > 2:
        severity = "moderate"
    else:
        severity = "low"
        
    return severity, count_score, area_score, type_score

def run_vit_prediction(image):
    """Optimized ViT prediction function that accepts an already loaded image"""
    # Ensure models are loaded
    _, vit_model, vit_transform = load_models()
    
    # Convert to RGB if not already
    if image.mode != "RGB":
        image = image.convert("RGB")
    
    # Preprocess image
    input_tensor = vit_transform(image).unsqueeze(0).to(device)
    
    # Use half precision if on GPU
    if torch.cuda.is_available():
        input_tensor = input_tensor.half()

    # Run inference with optimizations
    with torch.no_grad():
        output = vit_model(input_tensor).squeeze()

    # Process results
    thresholds = torch.tensor([best_thresholds[label] for label in vit_labels], device=device)
    predicted = (output > thresholds).int().cpu().numpy()

    # Use list comprehension for better performance
    predictions = [label for i, label in enumerate(vit_labels) if predicted[i]]
    return predictions

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
    if not bboxes:
        return []
        
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

def run_detection(image_path, location=None):
    """Run road damage detection with optimized processing"""
    detection_start = time.time()
    
    # Ensure models are loaded
    yolo_model, _, _ = load_models()
    
    try:
        # Load image once and reuse
        image = Image.open(image_path)
    except Exception as e:
        return {"error": f"Error loading image: {e}"}

    img_width, img_height = image.size
    
    # YOLO Detection with balanced parameters for speed and accuracy
    yolo_start = time.time()
    results = yolo_model.predict(
        source=image_path,
        save=False,
        verbose=False,
        conf=0.5,  # Confidence threshold
        iou=0.45,  # NMS threshold
        max_det=50,  # Maximum detections per image
        half=torch.cuda.is_available(),  # Use half precision if GPU available
        device=0 if torch.cuda.is_available() else 'cpu',  # Use GPU if available
        imgsz=640  # Standard image size
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