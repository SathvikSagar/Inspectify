"""
Hugging Face Integration Script for SafeStreet Models

This script helps download models from Hugging Face Hub and provides
utility functions to load them in the application.
"""

import os
import sys
import torch
import requests
from pathlib import Path
from tqdm import tqdm
import json

# Define model repository names on Hugging Face
REPO_OWNER = "venkatmadhu"  # Your Hugging Face username
MODEL_REPOS = {
    "yolo": f"{REPO_OWNER}/safestreet-yolo",
    "vit": f"{REPO_OWNER}/safestreet-vit",
    "road_classifier": f"{REPO_OWNER}/safestreet-road-classifier"
}

# Define local paths for downloaded models
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_PATHS = {
    "yolo": os.path.join(MODELS_DIR, "best.pt"),
    "vit": os.path.join(MODELS_DIR, "best_vit_multi_label.pth"),
    "road_classifier": os.path.join(MODELS_DIR, "road.pth")
}

# Hugging Face API token (set as environment variable)
HF_TOKEN = os.environ.get("HF_TOKEN", "")

def download_file(url, local_path, token=None):
    """Download a file from a URL with progress bar."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    response = requests.get(url, headers=headers, stream=True)
    response.raise_for_status()
    
    total_size = int(response.headers.get("content-length", 0))
    block_size = 1024  # 1 KB
    
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    
    with open(local_path, "wb") as file, tqdm(
        desc=os.path.basename(local_path),
        total=total_size,
        unit="B",
        unit_scale=True,
        unit_divisor=1024,
    ) as progress_bar:
        for data in response.iter_content(block_size):
            file.write(data)
            progress_bar.update(len(data))
    
    return local_path

def download_model_from_hf(model_type, force_download=False):
    """Download a model from Hugging Face Hub."""
    if model_type not in MODEL_REPOS:
        raise ValueError(f"Unknown model type: {model_type}")
    
    local_path = MODEL_PATHS[model_type]
    
    # Skip download if file exists and force_download is False
    if os.path.exists(local_path) and not force_download:
        print(f"Model {model_type} already exists at {local_path}")
        return local_path
    
    repo_id = MODEL_REPOS[model_type]
    filename = os.path.basename(local_path)
    
    # Hugging Face API URL for file download
    api_url = f"https://huggingface.co/{repo_id}/resolve/main/{filename}"
    
    print(f"Downloading {model_type} model from {repo_id}...")
    try:
        download_file(api_url, local_path, token=HF_TOKEN)
        print(f"Successfully downloaded {model_type} model to {local_path}")
        return local_path
    except Exception as e:
        print(f"Error downloading {model_type} model: {e}")
        return None

def download_all_models(force_download=False):
    """Download all models from Hugging Face Hub."""
    results = {}
    for model_type in MODEL_REPOS:
        results[model_type] = download_model_from_hf(model_type, force_download)
    return results

def get_model_path(model_type):
    """Get the local path for a model, downloading it if necessary."""
    if model_type not in MODEL_PATHS:
        raise ValueError(f"Unknown model type: {model_type}")
    
    local_path = MODEL_PATHS[model_type]
    
    if not os.path.exists(local_path):
        print(f"Model {model_type} not found locally. Downloading from Hugging Face...")
        download_model_from_hf(model_type)
    
    return local_path

if __name__ == "__main__":
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description="Download models from Hugging Face Hub")
    parser.add_argument("--model", choices=list(MODEL_REPOS.keys()) + ["all"], default="all",
                        help="Model to download (default: all)")
    parser.add_argument("--force", action="store_true", help="Force download even if model exists")
    args = parser.parse_args()
    
    if args.model == "all":
        results = download_all_models(args.force)
        print(json.dumps(results, indent=2))
    else:
        path = download_model_from_hf(args.model, args.force)
        print(f"Model path: {path}")