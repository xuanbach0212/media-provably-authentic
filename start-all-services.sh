#!/bin/bash

###############################################################################
# Media Provably Authentic - Start All Services
###############################################################################

set -e  # Exit on error

echo "========================================================================"
echo "STARTING MEDIA PROVABLY AUTHENTIC SYSTEM"
echo "========================================================================"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    
    echo -e "${BLUE}Waiting for $name...${NC}"
    for i in $(seq 1 $max_attempts); do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is ready${NC}"
            return 0
        fi
        sleep 1
    done
    echo -e "${YELLOW}⚠️  $name didn't start in time${NC}"
    return 1
}

echo ""
echo "Checking prerequisites..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

echo "✓ Node.js and Python 3 are installed"

# Stop any existing services
echo ""
echo "Stopping any existing services..."
pkill -f "python.*main.py" > /dev/null 2>&1 || true
pkill -f "ts-node-dev.*server.ts" > /dev/null 2>&1 || true
pkill -f "next dev" > /dev/null 2>&1 || true
sleep 2
echo "✓ Cleaned up existing processes"

# Create log directory
mkdir -p logs

echo ""
echo "========================================================================"
echo "STEP 1: Starting Python Services"
echo "========================================================================"

# Start AI Detection Service
echo -e "${BLUE}Starting AI Detection Service (port 8000)...${NC}"
cd "$PROJECT_ROOT/services/ai-detection"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment with Python 3.11..."
    ~/.pyenv/versions/3.11.13/bin/python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip setuptools wheel
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
nohup venv/bin/python main.py > "$PROJECT_ROOT/logs/ai-detection.log" 2>&1 &
cd "$PROJECT_ROOT"

# Start Reverse Search Service  
echo -e "${BLUE}Starting Reverse Search Service (port 8002)...${NC}"
cd "$PROJECT_ROOT/services/reverse-search"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment with Python 3.11..."
    ~/.pyenv/versions/3.11.13/bin/python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip setuptools wheel
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
nohup venv/bin/python main.py > "$PROJECT_ROOT/logs/reverse-search.log" 2>&1 &
cd "$PROJECT_ROOT"

# Wait for Python services
sleep 5
wait_for_service "http://localhost:8000/health" "AI Detection Service"
wait_for_service "http://localhost:8002/health" "Reverse Search Service"

echo ""
echo "========================================================================"
echo "STEP 2: Starting Backend API"
echo "========================================================================"

# Start Backend
echo -e "${BLUE}Starting Backend API (port 3001)...${NC}"
cd "$PROJECT_ROOT/backend"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent
fi
nohup npm run dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
cd "$PROJECT_ROOT"

# Wait for backend
sleep 3
wait_for_service "http://localhost:3001/health" "Backend API"

echo ""
echo "========================================================================"
echo "STEP 3: Starting Frontend"
echo "========================================================================"

# Start Frontend
echo -e "${BLUE}Starting Next.js Frontend (port 3000)...${NC}"
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent
fi
nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
cd "$PROJECT_ROOT"

# Wait for frontend
sleep 5
wait_for_service "http://localhost:3000" "Frontend"

echo ""
echo "========================================================================"
echo "✅ ALL SERVICES STARTED SUCCESSFULLY!"
echo "========================================================================"
echo ""
echo "Service Status:"
echo "  ✓ AI Detection:    http://localhost:8000"
echo "  ✓ Reverse Search:  http://localhost:8002"
echo "  ✓ Backend API:     http://localhost:3001"
echo "  ✓ Frontend:        http://localhost:3000"
echo ""
echo "Logs are available in: $PROJECT_ROOT/logs/"
echo ""
echo "To view logs:"
echo "  tail -f logs/ai-detection.log"
echo "  tail -f logs/reverse-search.log"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo ""
echo "To stop all services:"
echo "  ./stop-all-services.sh"
echo ""
echo "Open in browser: http://localhost:3000"
echo "========================================================================"

