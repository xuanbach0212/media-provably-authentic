#!/bin/bash

# Test script for Media Provably Authentic system
# This script checks if all services are running and healthy

echo "🧪 Testing Media Provably Authentic System"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $response)${NC}"
        return 1
    fi
}

# Check all services
echo "1. Checking Service Health:"
echo ""

check_service "Mock Services     " "http://localhost:3002/health"
mock_status=$?

check_service "Backend API       " "http://localhost:3001/health"
backend_status=$?

check_service "AI Detection      " "http://localhost:8001/health"
ai_status=$?

check_service "Reverse Search    " "http://localhost:8002/health"
search_status=$?

check_service "Frontend          " "http://localhost:3000"
frontend_status=$?

echo ""
echo "=========================================="

# Summary
failed=0
if [ $mock_status -ne 0 ]; then ((failed++)); fi
if [ $backend_status -ne 0 ]; then ((failed++)); fi
if [ $ai_status -ne 0 ]; then ((failed++)); fi
if [ $search_status -ne 0 ]; then ((failed++)); fi
if [ $frontend_status -ne 0 ]; then ((failed++)); fi

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All services are running!${NC}"
    echo ""
    echo "You can now:"
    echo "  - Visit frontend: http://localhost:3000"
    echo "  - Upload media to test the verification flow"
    exit 0
else
    echo -e "${RED}✗ $failed service(s) failed${NC}"
    echo ""
    echo "Make sure all services are running:"
    echo "  npm run dev"
    echo ""
    echo "Or start services individually:"
    echo "  npm run dev:mock-services"
    echo "  npm run dev:backend"
    echo "  npm run dev:ai"
    echo "  npm run dev:reverse-search"
    echo "  npm run dev:frontend"
    exit 1
fi

