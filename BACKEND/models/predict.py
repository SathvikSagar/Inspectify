# Import PyTorch - the deep learning framework used for our neural network model
import torch
# Import neural network modules from PyTorch - provides building blocks for creating neural networks
import torch.nn as nn
# Import image transformation utilities - for preprocessing images before feeding to the model
import torchvision.transforms as transforms
# Import PIL (Python Imaging Library) - for loading and manipulating images
from PIL import Image
# Import sys module - provides access to command-line arguments and system-specific parameters
import sys
# Import os module - provides functions for interacting with the operating system and file paths
import os

# Define the CNN (Convolutional Neural Network) Model architecture
# This architecture must exactly match what was used during training
class CNN(nn.Module):  
    def __init__(self):
        # Initialize the parent class (nn.Module) - standard PyTorch practice
        super(CNN, self).__init__()
        # First convolutional layer: 
        # - Takes 3 input channels (RGB image)
        # - Outputs 16 feature maps
        # - Uses 3x3 kernel with stride 1 and padding 1 (maintains spatial dimensions)
        self.conv1 = nn.Conv2d(3, 16, kernel_size=3, stride=1, padding=1)
        
        # Second convolutional layer:
        # - Takes 16 input channels (from conv1)
        # - Outputs 32 feature maps
        # - Uses 3x3 kernel with stride 1 and padding 1
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, stride=1, padding=1)
        
        # Third convolutional layer:
        # - Takes 32 input channels (from conv2)
        # - Outputs 64 feature maps
        # - Uses 3x3 kernel with stride 1 and padding 1
        self.conv3 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)
        
        # Max pooling layer - reduces spatial dimensions by half after each conv layer
        # 2x2 window with stride 2 (non-overlapping windows)
        self.pool = nn.MaxPool2d(2, 2)
        
        # First fully connected layer:
        # - Input: 64 feature maps of size 16x16 (flattened to 64*16*16=16384)
        # - Output: 128 neurons
        self.fc1 = nn.Linear(64 * 16 * 16, 128)
        
        # Second fully connected layer (output layer):
        # - Input: 128 neurons (from fc1)
        # - Output: 1 neuron (binary classification)
        self.fc2 = nn.Linear(128, 1)
        
        # Sigmoid activation function - converts output to probability between 0 and 1
        # Used for binary classification (road vs. not road)
        self.sigmoid = nn.Sigmoid()

    # Define the forward pass - how data flows through the network
    def forward(self, x):
        # First convolutional block:
        # 1. Apply conv1 to input x
        # 2. Apply ReLU activation (introduces non-linearity)
        # 3. Apply max pooling (reduces spatial dimensions by half)
        x = self.pool(nn.ReLU()(self.conv1(x)))
        
        # Second convolutional block:
        # Same pattern: convolution -> ReLU -> max pooling
        x = self.pool(nn.ReLU()(self.conv2(x)))
        
        # Third convolutional block:
        # Same pattern: convolution -> ReLU -> max pooling
        x = self.pool(nn.ReLU()(self.conv3(x)))
        
        # Flatten the 3D feature maps (64 channels of 16x16) to 1D vector
        # -1 means batch size is inferred, 64*16*16 is the flattened feature dimension
        x = x.view(-1, 64 * 16 * 16)
        
        # First fully connected layer with ReLU activation
        x = nn.ReLU()(self.fc1(x))
        
        # Second fully connected layer (output layer)
        x = self.fc2(x)
        
        # Apply sigmoid to get probability output (0-1)
        x = self.sigmoid(x)
        
        # Return the final prediction
        return x

# Set up the device for computation - use GPU (cuda) if available, otherwise CPU
# This improves performance significantly if a compatible GPU is present
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Construct the path to the saved model file (road.pth)
# __file__ gives the current file's path, dirname gets its directory
# This ensures the model is found regardless of where the script is run from
model_path = os.path.join(os.path.dirname(__file__), "road.pth")

# Create an instance of our CNN model
model = CNN()
# Move the model to the appropriate device (GPU or CPU)
model = model.to(device)

# Load the pre-trained weights from the saved model file
# map_location ensures the model loads correctly regardless of where it was trained
model.load_state_dict(torch.load(model_path, map_location=device))

# Set the model to evaluation mode
# This disables dropout and uses running statistics for batch normalization
# Essential for correct inference behavior
model.eval()

# Define the image transformation pipeline that will be applied to each input image
# Must exactly match the preprocessing used during training for consistent results
transform = transforms.Compose([
    # Resize all input images to 128x128 pixels - the size expected by our model
    transforms.Resize((128, 128)),
    
    # Convert PIL Image to PyTorch tensor with values in range [0,1]
    transforms.ToTensor(),
    
    # Normalize pixel values to range [-1,1] using mean=0.5, std=0.5
    # This improves model convergence and performance
    transforms.Normalize((0.5,), (0.5,))
])

# Define the function that performs prediction on a given image
def predict_image(image_path):
    # Load the image from the specified path
    # Convert to RGB format to ensure 3 channels (even if image is grayscale)
    image = Image.open(image_path).convert("RGB")
    
    # Apply the transformation pipeline to preprocess the image:
    # 1. Resize to 128x128
    # 2. Convert to tensor
    # 3. Normalize values
    # 4. Add batch dimension with unsqueeze(0)
    # 5. Move to the appropriate device (GPU/CPU)
    image = transform(image).unsqueeze(0).to(device)
    
    # Disable gradient calculation during inference
    # This reduces memory usage and speeds up computation
    with torch.no_grad():
        # Pass the image through the model to get the prediction
        output = model(image)
    
    # Extract the scalar confidence value from the output tensor
    # output is a tensor with shape [1,1], item() gets the single value
    confidence = output.item()
    
    # Convert confidence score to binary prediction
    # If confidence < 0.5, classify as "Not a Road", otherwise "Road"
    # Note: Comment mentions threshold was originally 0.5, considered changing to 0.3,
    # but code still uses 0.5
    prediction = "Not a Road" if confidence < 0.5 else "Road"
    
    # Print the prediction and confidence score for debugging/logging
    # Formats confidence to 4 decimal places
    print(f"{prediction} (confidence: {confidence:.4f})")
    
    # Return the string prediction ("Road" or "Not a Road")
    return prediction

# This block only executes when the script is run directly (not when imported)
if __name__ == "__main__":
    # Check if an image path was provided as a command-line argument
    if len(sys.argv) < 2:
        # If no argument was provided, print usage instructions
        print("Usage: python predict.py <image_path>")
        # Exit with error code 1 (indicating abnormal termination)
        sys.exit(1)

    # Extract the image path from command-line arguments
    # sys.argv[0] is the script name, sys.argv[1] is the first argument
    image_path = sys.argv[1]
    
    # Verify that the specified image file exists
    if not os.path.exists(image_path):
        # If file doesn't exist, print error message
        print(f"Error: Image file '{image_path}' not found!")
        # Exit with error code 1
        sys.exit(1)

    # Call the prediction function with the provided image path
    result = predict_image(image_path)
    
    # Print the result - this output can be captured by the Node.js server
    # that calls this Python script
    print(result)
