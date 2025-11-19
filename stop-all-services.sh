#!/bin/bash

###############################################################################
# Media Provably Authentic - Stop All Services
###############################################################################

echo "Stopping all services..."

# Stop Python services
pkill -f "python.*main.py" > /dev/null 2>&1 || true

# Stop Node services
pkill -f "ts-node-dev.*server.ts" > /dev/null 2>&1 || true
pkill -f "next dev" > /dev/null 2>&1 || true

# Wait a moment
sleep 2

echo "✓ All services stopped"

