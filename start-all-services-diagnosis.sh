#!/bin/bash

# Comprehensive service startup script with diagnostics
# This ensures all services are running properly

set -e

PROJECT_ROOT="/Users/s29815/Developer/Hackathon/media-provably-authentic"
cd "$PROJECT_ROOT"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         STARTING ALL SERVICES WITH DIAGNOSTICS                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Function to check if a port is in use
check_port() {
  local port=$1
  lsof -ti:$port > /dev/null 2>&1
}

# Function to kill process on port
kill_port() {
  local port=$1
  local service=$2
  if check_port $port; then
    echo "⚠️  Port $port already in use by $service, killing old process..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
    echo "✅ Port $port freed"
  fi
}

# 1. Check Redis
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. CHECKING REDIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if redis-cli ping > /dev/null 2>&1; then
  echo "✅ Redis is running"
else
  echo "❌ Redis is not running!"
  echo "   Start with: redis-server"
  echo "   Or install: brew install redis"
  exit 1
fi
echo ""

# 2. Start AI Detection Service
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. STARTING AI DETECTION SERVICE (Port 8000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
kill_port 8000 "AI Detection"
cd "$PROJECT_ROOT/services/ai-detection"
if [ ! -d "venv" ]; then
  echo "⚠️  Virtual environment not found, creating..."
  python3 -m venv venv
fi
source venv/bin/activate
nohup python main.py > /tmp/ai-detection-diagnosis.log 2>&1 &
AI_PID=$!
echo "✅ AI Detection started (PID: $AI_PID)"
echo "   Log: /tmp/ai-detection-diagnosis.log"
sleep 3
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "✅ AI Detection health check passed"
else
  echo "❌ AI Detection health check failed"
  tail -20 /tmp/ai-detection-diagnosis.log
  exit 1
fi
echo ""

# 3. Start Reverse Search Service
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. STARTING REVERSE SEARCH SERVICE (Port 8001)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
kill_port 8001 "Reverse Search"
cd "$PROJECT_ROOT/services/reverse-search"
if [ ! -d "venv" ]; then
  echo "⚠️  Virtual environment not found, creating..."
  python3 -m venv venv
fi
source venv/bin/activate
nohup python main.py > /tmp/reverse-search-diagnosis.log 2>&1 &
REVERSE_PID=$!
echo "✅ Reverse Search started (PID: $REVERSE_PID)"
echo "   Log: /tmp/reverse-search-diagnosis.log"
sleep 3
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
  echo "✅ Reverse Search health check passed"
else
  echo "❌ Reverse Search health check failed"
  tail -20 /tmp/reverse-search-diagnosis.log
  exit 1
fi
echo ""

# 4. Start Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. STARTING BACKEND (Port 3001)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
kill_port 3001 "Backend"
cd "$PROJECT_ROOT/backend"
nohup npm run dev > /tmp/backend-diagnosis.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
echo "   Log: /tmp/backend-diagnosis.log"
sleep 8
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "✅ Backend health check passed"
  echo ""
  echo "   Checking backend logs for processor startup..."
  if grep -q "Multi-Worker Processor" /tmp/backend-diagnosis.log; then
    echo "   ✅ Multi-Worker Processor started"
  elif grep -q "Single Processor" /tmp/backend-diagnosis.log; then
    echo "   ✅ Single Processor started"
  else
    echo "   ⚠️  Processor status unknown"
  fi
else
  echo "❌ Backend health check failed"
  tail -30 /tmp/backend-diagnosis.log
  exit 1
fi
echo ""

# 5. Start Frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. STARTING FRONTEND (Port 3000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
kill_port 3000 "Frontend"
cd "$PROJECT_ROOT/frontend"
nohup npm run dev > /tmp/frontend-diagnosis.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo "   Log: /tmp/frontend-diagnosis.log"
sleep 5
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend health check passed"
else
  echo "⚠️  Frontend may still be starting..."
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ALL SERVICES STARTED                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Service Status:"
echo "   ✅ Redis:          Running"
echo "   ✅ AI Detection:   http://localhost:8000 (PID: $AI_PID)"
echo "   ✅ Reverse Search: http://localhost:8001 (PID: $REVERSE_PID)"
echo "   ✅ Backend:        http://localhost:3001 (PID: $BACKEND_PID)"
echo "   ✅ Frontend:       http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "📝 Logs:"
echo "   - AI Detection:   /tmp/ai-detection-diagnosis.log"
echo "   - Reverse Search: /tmp/reverse-search-diagnosis.log"
echo "   - Backend:        /tmp/backend-diagnosis.log"
echo "   - Frontend:       /tmp/frontend-diagnosis.log"
echo ""
echo "🧪 Test Pages:"
echo "   - Main App:       http://localhost:3000/app"
echo "   - Socket Test:    http://localhost:3000/test-socket"
echo "   - Landing:        http://localhost:3000"
echo ""
echo "🔍 To check logs:"
echo "   tail -f /tmp/backend-diagnosis.log"
echo "   tail -f /tmp/ai-detection-diagnosis.log"
echo ""
echo "🛑 To stop all services:"
echo "   kill $AI_PID $REVERSE_PID $BACKEND_PID $FRONTEND_PID"
echo ""

