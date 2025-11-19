#!/bin/bash
# Start AI Detection Service with virtualenv

echo "🚀 Starting AI Detection Service..."
echo "=================================="

# Navigate to service directory
cd "$(dirname "$0")"

# Check if virtualenv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtualenv not found. Creating..."
    python -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install torch torchvision transformers pillow numpy fastapi uvicorn python-multipart pydantic opencv-python scikit-image exifread scipy requests
else
    echo "✅ Virtualenv found"
fi

# Activate virtualenv
source venv/bin/activate

# Check Python version
echo "Python: $(python --version)"
echo "Location: $(which python)"

# Start service
echo ""
echo "🤖 Starting service on http://localhost:8001"
echo "=================================="
python main.py

