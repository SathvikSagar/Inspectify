#!/bin/bash

# Install Python dependencies
pip install -r vercel-requirements.txt

# Log installed packages
pip list

# Create necessary directories
mkdir -p /tmp/uploads
mkdir -p /tmp/final

# Log environment information
echo "Node version: $(node -v)"
echo "Python version: $(python3 -v)"
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"