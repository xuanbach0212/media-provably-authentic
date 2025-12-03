#!/bin/bash

###############################################################################
# Raspberry Pi Deployment Script
###############################################################################

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🍓 Raspberry Pi Deployment - Media Provably Authentic   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "⚠️  Warning: This doesn't appear to be a Raspberry Pi"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found!"
    echo "Install with: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found!"
    echo "Install with: sudo apt install docker-compose"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Check .env files
echo "📋 Checking environment files..."
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found!"
    echo "Please create it from backend/.env.example"
    exit 1
fi

if [ ! -f "services/reverse-search/.env" ]; then
    echo "❌ services/reverse-search/.env not found!"
    echo "Please create it from services/reverse-search/.env.example"
    exit 1
fi

echo "✅ Environment files found"
echo ""

# Verify Docker service URLs in backend/.env
echo "🔍 Verifying backend/.env configuration..."
if grep -q "REDIS_HOST=localhost" backend/.env; then
    echo "⚠️  WARNING: REDIS_HOST=localhost detected!"
    echo "   For Docker, it should be: REDIS_HOST=redis"
    read -p "Auto-fix? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i 's|REDIS_HOST=localhost|REDIS_HOST=redis|g' backend/.env
        sed -i 's|REDIS_URL=redis://localhost:6379|REDIS_URL=redis://redis:6379|g' backend/.env
        sed -i 's|AI_DETECTION_URL=http://localhost:8000|AI_DETECTION_URL=http://ai-detection:8000|g' backend/.env
        sed -i 's|REVERSE_SEARCH_URL=http://localhost:8002|REVERSE_SEARCH_URL=http://reverse-search:8002|g' backend/.env
        echo "✅ Fixed Docker service URLs"
    fi
fi

echo ""
echo "🐳 Building Docker images..."
echo "⏱️  This will take 15-20 minutes on Raspberry Pi..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🔍 Checking service health..."

# Check Redis
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis: OK"
else
    echo "❌ Redis: Failed"
fi

# Check AI Detection
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ AI Detection: OK"
else
    echo "⚠️  AI Detection: Starting (models loading...)"
fi

# Check Reverse Search
if curl -sf http://localhost:8002/health > /dev/null 2>&1; then
    echo "✅ Reverse Search: OK"
else
    echo "⚠️  Reverse Search: Starting..."
fi

# Check Backend
if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend: OK"
else
    echo "⚠️  Backend: Starting..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  ✅ DEPLOYMENT COMPLETE!                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🌐 Services:"
echo "   Backend API:     http://localhost:3001"
echo "   AI Detection:    http://localhost:8000"
echo "   Reverse Search:  http://localhost:8002"
echo ""
echo "📝 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🔄 Next steps:"
echo "   1. Setup Cloudflare Tunnel (see RASPBERRY_PI_DEPLOYMENT.md)"
echo "   2. Update Vercel frontend with backend URL"
echo "   3. Test the application!"
echo ""
echo "⚠️  Note: AI models are loading in background."
echo "   First request may take 5-10 minutes."
echo "   Check progress: docker-compose logs -f ai-detection"
echo ""

