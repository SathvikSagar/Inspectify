import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import sys
import os
import io
import base64

# Define the CNN Model (Must match training architecture)
class CNN(nn.Module):  
    def __init__(self):
        super(CNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 16, kernel_size=3, stride=1, padding=1)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, stride=1, padding=1)
        self.conv3 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 16 * 16, 128)
        self.fc2 = nn.Linear(128, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.pool(nn.ReLU()(self.conv1(x)))
        x = self.pool(nn.ReLU()(self.conv2(x)))
        x = self.pool(nn.ReLU()(self.conv3(x)))
        x = x.view(-1, 64 * 16 * 16)
        x = nn.ReLU()(self.fc1(x))
        x = self.fc2(x)
        x = self.sigmoid(x)
        return x

# 🔹 Load the saved model
device = torch.device("cpu")  # Force CPU for Vercel
model_path = os.path.join(os.path.dirname(__file__), "road.pth")  # Ensure correct path

# Check if model exists
if not os.path.exists(model_path):
    print(f"Error: Model file '{model_path}' not found!")
    print(f"Current directory: {os.getcwd()}")
    print(f"Directory contents: {os.listdir(os.path.dirname(__file__))}")
    sys.exit(1)

try:
    model = CNN().to(device)  # Initialize model
    model.load_state_dict(torch.load(model_path, map_location=device))  # Load weights
    model.eval()  # Set to evaluation mode
    print(f"Model loaded successfully from {model_path}")
except Exception as e:
    print(f"Error loading model: {str(e)}")
    sys.exit(1)

# 🔹 Define Image Transformation (Must match training preprocessing)
transform = transforms.Compose([
    transforms.Resize((128, 128)),  # Resize image to match model input
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))  # Same normalization as training
])

# 🔹 Prediction Function
def predict_image(image_path):
    try:
        print(f"Opening image from: {image_path}")
        image = Image.open(image_path).convert("RGB")  # Convert grayscale images to RGB
        image = transform(image).unsqueeze(0).to(device)  # Preprocess
        
        with torch.no_grad():
            output = model(image)
        
        # Lower the threshold to make the model more likely to classify as a road
        confidence = output.item()
        prediction = "Not a Road" if confidence < 0.3 else "Road"
        
        # Print confidence for debugging
        print(f"{prediction} (confidence: {confidence:.4f})")
        return prediction
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        return "Error"

# 🔹 Run the script with command-line input
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Error: Image file '{image_path}' not found!")
        sys.exit(1)

    result = predict_image(image_path)
    print(result)  # Send prediction output to Node.js server