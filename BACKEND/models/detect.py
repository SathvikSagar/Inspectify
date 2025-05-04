from ultralytics import YOLO 
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import sys
import os
import json
from pymongo import MongoClient
from datetime import datetime
import timm

# ======= Load YOLO model =======
yolo_model = YOLO(r'C:\Users\USER\tailwindsample\BACKEND\models\best.pt')  # update path

# ======= Load ViT model =======
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
vit_model = timm.create_model('deit_tiny_patch16_224', pretrained=False)
vit_model.head = nn.Sequential(
    nn.Linear(vit_model.head.in_features, 4),
    nn.Sigmoid()
)
vit_model.load_state_dict(torch.load(r'C:\Users\USER\tailwindsample\BACKEND\models\best_vit_multi_label.pth', map_location=device))
vit_model.to(device)
vit_model.eval()

# Transform for ViT
vit_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

vit_labels = ["pothole", "longitudinal_crack", "lateral_crack", "alligator_crack"]

# Custom thresholds for ViT predictions
best_thresholds = {
    "pothole": 0.01,
    "longitudinal_crack": 0.4,
    "lateral_crack": 0.4,
    "alligator_crack": 0.01
}

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

    severity = "Low"
    if count_score > 5 or area_score > 15 or type_score > 2:
        severity = "Medium"
    if count_score > 10 or area_score > 30:
        severity = "High"
    if count_score > 15 or area_score > 50:
        severity = "Severe"
    return severity, count_score, area_score, type_score

def run_vit_prediction(image_path):
    image = Image.open(image_path).convert("RGB")
    input_tensor = vit_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = vit_model(input_tensor).squeeze()

    thresholds = torch.tensor([best_thresholds[label] for label in vit_labels], device=device)
    predicted = (output > thresholds).int().cpu().numpy()

    predictions = [label for i, label in enumerate(vit_labels) if predicted[i]]
    return predictions

def run_detection(image_path, location=None):
    try:
        image = Image.open(image_path)
    except Exception as e:
        return {"error": f"Error loading image: {e}"}

    img_width, img_height = image.size

    # YOLO Detection
    results = yolo_model.predict(source=image_path, save=False, verbose=False)
    if not results:
        return {"error": "No results"}

    result = results[0]
    bboxes = []
    for box in result.boxes:
        conf = float(box.conf[0].item())
        if conf < 0.05:
            continue  # Skip boxes below the threshold

        x1, y1, x2, y2 = box.xyxy[0].tolist()
        cls_id = int(box.cls[0].item())
        cls_name = result.names[cls_id]

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
    vit_predictions = run_vit_prediction(image_path)

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
        "longitude": location.get("longitude") if location else None
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
            "vit_predictions": data["vit_predictions"],
            "location": data.get("location", {}),
            "annotated_image": "runs/detect/predict/" + os.path.basename(image_path),
        }

        collection.insert_one(document)
    except Exception as e:
        pass  # optionally log

# ======= Script Entry =======
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python detect.py <image_path> [latitude] [longitude]"}))
        sys.exit(1)

    image_path = sys.argv[1]
    latitude = float(sys.argv[2]) if len(sys.argv) > 2 else None
    longitude = float(sys.argv[3]) if len(sys.argv) > 3 else None

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file {image_path} not found."}))
        sys.exit(1)

    location = {"latitude": latitude, "longitude": longitude}
    result = run_detection(image_path, location=location)

    if "error" not in result:
        save_to_mongodb(result, image_path)

    print(json.dumps(result, indent=2))
