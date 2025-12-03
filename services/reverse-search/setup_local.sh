#!/bin/bash
set -e

echo "🔍 Setting up Reverse Search local environment..."

# Use Python 3.11 from pyenv
export PYENV_VERSION=3.11.13

# Remove old venv if exists
if [ -d "venv" ]; then
    echo "🗑️  Removing old virtualenv..."
    rm -rf venv
fi

# Create new virtualenv with Python 3.11
echo "📦 Creating virtualenv with Python 3.11..."
~/.pyenv/versions/3.11.13/bin/python3 -m venv venv

# Activate virtualenv
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install requirements
echo "📥 Installing requirements..."
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start Reverse Search locally:"
echo "  cd services/reverse-search"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --host 0.0.0.0 --port 8002"
echo ""
