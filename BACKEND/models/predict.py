import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import sys
import os
import time
import io

# Enable performance optimizations
torch.set_num_threads(4)  # Optimal thread count for most systems
torch.backends.cudnn.benchmark = True  # Speed up fixed-size image inference

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
        # Use ReLU modules directly for better performance
        self.relu = nn.ReLU(inplace=True)  # inplace=True saves memory

    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = self.pool(self.relu(self.conv3(x)))
        x = x.view(-1, 64 * 16 * 16)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        x = self.sigmoid(x)
        return x

# Global variables for model and transform to avoid reloading
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None
transform = None

def load_model():
    """Load model only once and cache it"""
    global model, transform, device
    
    if model is None:
        start_time = time.time()
        
        # Load model
        model_path = os.path.join(os.path.dirname(__file__), "road.pth")
        model = CNN().to(device)
        
        # Use JIT compilation for faster inference if on CPU
        if device.type == 'cpu':
            # Load state dict first
            model.load_state_dict(torch.load(model_path, map_location=device))
            model.eval()
            # Create example input for tracing
            example = torch.rand(1, 3, 128, 128).to(device)
            # JIT trace the model
            model = torch.jit.trace(model, example)
        else:
            # For GPU, just load normally
            model.load_state_dict(torch.load(model_path, map_location=device))
            model.eval()
            
        # Use half precision if GPU is available for faster inference
        if device.type == 'cuda':
            model = model.half()
            
        # Define optimized transform pipeline
        transform = transforms.Compose([
            transforms.Resize((128, 128), antialias=True),  # Use antialiasing for better quality
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,))
        ])
        
        print(f"Model loaded in {time.time() - start_time:.2f} seconds on {device}")
    
    return model, transform

# Optimized prediction function
def predict_image(image_path):
    """Predict if an image contains a road with optimized processing"""
    start_time = time.time()
    
    # Load model (will use cached version if already loaded)
    model, transform = load_model()
    
    # Efficient image loading
    try:
        # Read image file into memory first to avoid disk I/O during processing
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
            
        # Load image from memory buffer
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Resize and preprocess in one step
        input_tensor = transform(image).unsqueeze(0)
        
        # Use half precision if on GPU
        if device.type == 'cuda':
            input_tensor = input_tensor.half()
            
        input_tensor = input_tensor.to(device)
        
        # Run inference with optimizations
        with torch.no_grad():
            output = model(input_tensor)
        
        # Process result
        confidence = output.item()
        prediction = "Not a Road" if confidence < 0.3 else "Road"
        
        # Print timing and confidence information
        inference_time = time.time() - start_time
        print(f"{prediction} (confidence: {confidence:.4f}, time: {inference_time:.3f}s)")
        
        return prediction
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        return "Error"

# Run the script with command-line input
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Error: Image file '{image_path}' not found!")
        sys.exit(1)

    # Time the entire prediction process
    overall_start = time.time()
    result = predict_image(image_path)
    print(f"{result} (total time: {time.time() - overall_start:.3f}s)")  # Send prediction output to Node.js server
