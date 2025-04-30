from ultralytics import YOLO
import sys
import os
import json
from PIL import Image
from pymongo import MongoClient
from datetime import datetime

# Load YOLO model
model = YOLO(r'C:\Users\USER\tailwindsample\BACKEND\models\best1.pt')  # update path if needed

# Class-specific colors
def get_class_color(cls_name):
    if cls_name in ["pothole", "alligator crack"]:
        return [255, 0, 0]  # Red
    elif cls_name in ["longitudinal crack", "lateral crack"]:
        return [0, 0, 139]  # Dark Blue
    return [0, 255, 0]  # Green

# Severity logic
def get_severity(bboxes, img_width, img_height):
    count_score = len(bboxes)
    area_score = sum([box['rel_area'] for box in bboxes])
    type_score = len(set([box['class'] for box in bboxes]))

    severity = "Low"
    if count_score > 5 or area_score > 15 or type_score > 2:
        severity = "Medium"
    if count_score > 10 or area_score > 30:
        severity = "High"
    if count_score > 15 or area_score > 50:
        severity = "Severe"
    return severity, count_score, area_score, type_score

def run_detection(image_path):
    try:
        image = Image.open(image_path)
    except Exception as e:
        return {"error": f"Error loading image: {e}"}

    img_width, img_height = image.size

    # Run YOLO model prediction
    results = model.predict(source=image_path, save=False, verbose=False)

    if not results:
        return {"error": "No results"}

    result = results[0]  # Assuming single image input

    bboxes = []
    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        cls_id = int(box.cls[0].item())
        cls_name = result.names[cls_id]
        conf = float(box.conf[0].item())

        width = x2 - x1
        height = y2 - y1
        area = width * height
        rel_width = width / img_width * 100
        rel_height = height / img_height * 100
        rel_area = area / (img_width * img_height) * 100

        bboxes.append({
            "bbox": [x1, y1, x2, y2],
            "class": cls_name,
            "conf": round(conf, 2),
            "width": round(width, 1),
            "height": round(height, 1),
            "area": round(area, 1),
            "rel_width": round(rel_width, 2),
            "rel_height": round(rel_height, 2),
            "rel_area": round(rel_area, 2),
            "color": get_class_color(cls_name)
        })

    severity, count_score, area_score, type_score = get_severity(bboxes, img_width, img_height)

    result_json = {
        "detections": bboxes,
        "severity": {
            "level": severity,
            "count_score": count_score,
            "area_score": area_score,
            "type_score": type_score
        },
        "image_dimensions": [img_width, img_height]
    }

    return result_json

def save_to_mongodb(data, image_path):
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["road_damage_detection"]
        collection = db["detections"]

        document = {
            "filename": os.path.basename(image_path),
            "timestamp": datetime.now().isoformat(),
            "severity": data["severity"],
            "image_dimensions": data["image_dimensions"],
            "detections": data["detections"],
            "annotated_image": "runs/detect/predict/" + os.path.basename(image_path),
        }

        collection.insert_one(document)
    except Exception as e:
        pass  # optionally log to a file if needed

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python detect.py <image_path>"}))
        sys.exit(1)

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file {image_path} not found."}))
        sys.exit(1)

    result = run_detection(image_path)
    if "error" not in result:
        save_to_mongodb(result, image_path)

    # Output ONLY final result as JSON (clean)
    print(json.dumps(result))
