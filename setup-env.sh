#!/bin/bash

# ============================================
# Environment Setup Script
# ============================================
# This script helps you setup .env files for all services

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🔐 Environment Variables Setup                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# 1. Backend .env
# ============================================
echo -e "${BLUE}📦 Setting up Backend .env...${NC}"
echo ""

if [ -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env already exists!${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✅ Keeping existing backend/.env${NC}"
    else
        cp backend/env.example backend/.env
        echo -e "${GREEN}✅ Created backend/.env from template${NC}"
    fi
else
    cp backend/env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env from template${NC}"
fi

echo ""

# ============================================
# 2. Reverse Search .env
# ============================================
echo -e "${BLUE}🔍 Setting up Reverse Search .env...${NC}"
echo ""

if [ -f "services/reverse-search/.env" ]; then
    echo -e "${YELLOW}⚠️  services/reverse-search/.env already exists!${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✅ Keeping existing reverse-search/.env${NC}"
    else
        cp services/reverse-search/env.example services/reverse-search/.env
        echo -e "${GREEN}✅ Created reverse-search/.env from template${NC}"
    fi
else
    cp services/reverse-search/env.example services/reverse-search/.env
    echo -e "${GREEN}✅ Created reverse-search/.env from template${NC}"
fi

echo ""

# ============================================
# 3. Prompt for required values
# ============================================
echo -e "${BLUE}🔑 Now let's fill in the required values...${NC}"
echo ""
echo -e "${YELLOW}Press Enter to skip and edit manually later${NC}"
echo ""

# SUI_PRIVATE_KEY
echo -e "${BLUE}1. SUI_PRIVATE_KEY${NC}"
echo "   Get from: sui client new-address ed25519"
read -p "   Enter your Sui private key (or press Enter to skip): " SUI_PRIVATE_KEY
echo ""

# SUI_PACKAGE_ID
echo -e "${BLUE}2. SUI_PACKAGE_ID${NC}"
echo "   Get from: cd contracts/sui-contract && sui client publish"
read -p "   Enter your Sui Package ID (or press Enter to skip): " SUI_PACKAGE_ID
echo ""

# SEAL_POLICY_PACKAGE
echo -e "${BLUE}3. SEAL_POLICY_PACKAGE${NC}"
echo "   Get from: cd contracts/seal-policy && sui client publish"
read -p "   Enter your Seal Policy Package ID (or press Enter to skip): " SEAL_POLICY_PACKAGE
echo ""

# SERPAPI_KEY
echo -e "${BLUE}4. SERPAPI_KEY (Optional)${NC}"
echo "   Get from: https://serpapi.com (free tier: 100 searches/month)"
read -p "   Enter your SerpAPI key (or press Enter to skip): " SERPAPI_KEY
echo ""

# ============================================
# 4. Update .env files
# ============================================
if [ -n "$SUI_PRIVATE_KEY" ]; then
    sed -i.bak "s|SUI_PRIVATE_KEY=.*|SUI_PRIVATE_KEY=$SUI_PRIVATE_KEY|g" backend/.env
    echo -e "${GREEN}✅ Updated SUI_PRIVATE_KEY in backend/.env${NC}"
fi

if [ -n "$SUI_PACKAGE_ID" ]; then
    sed -i.bak "s|SUI_PACKAGE_ID=.*|SUI_PACKAGE_ID=$SUI_PACKAGE_ID|g" backend/.env
    echo -e "${GREEN}✅ Updated SUI_PACKAGE_ID in backend/.env${NC}"
fi

if [ -n "$SEAL_POLICY_PACKAGE" ]; then
    sed -i.bak "s|SEAL_POLICY_PACKAGE=.*|SEAL_POLICY_PACKAGE=$SEAL_POLICY_PACKAGE|g" backend/.env
    echo -e "${GREEN}✅ Updated SEAL_POLICY_PACKAGE in backend/.env${NC}"
fi

if [ -n "$SERPAPI_KEY" ]; then
    sed -i.bak "s|SERPAPI_KEY=.*|SERPAPI_KEY=$SERPAPI_KEY|g" services/reverse-search/.env
    echo -e "${GREEN}✅ Updated SERPAPI_KEY in reverse-search/.env${NC}"
fi

# Clean up backup files
rm -f backend/.env.bak services/reverse-search/.env.bak

echo ""

# ============================================
# 5. Summary
# ============================================
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         ✅ Setup Complete!                                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📝 Created files:${NC}"
echo "   ✅ backend/.env"
echo "   ✅ services/reverse-search/.env"
echo ""

# Check if values were set
if [ -z "$SUI_PRIVATE_KEY" ] || [ -z "$SUI_PACKAGE_ID" ] || [ -z "$SEAL_POLICY_PACKAGE" ]; then
    echo -e "${YELLOW}⚠️  Some required values are missing!${NC}"
    echo ""
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo "   1. Edit backend/.env and fill in:"
    [ -z "$SUI_PRIVATE_KEY" ] && echo "      - SUI_PRIVATE_KEY"
    [ -z "$SUI_PACKAGE_ID" ] && echo "      - SUI_PACKAGE_ID"
    [ -z "$SEAL_POLICY_PACKAGE" ] && echo "      - SEAL_POLICY_PACKAGE"
    echo ""
    echo "   2. See ENV_SETUP.md for detailed guide"
    echo ""
else
    echo -e "${GREEN}✅ All required values are set!${NC}"
    echo ""
    echo -e "${BLUE}🚀 You can now start the services:${NC}"
    echo "   ./start-all-services.sh"
    echo ""
fi

if [ -z "$SERPAPI_KEY" ]; then
    echo -e "${YELLOW}ℹ️  SERPAPI_KEY not set - Reverse search will use pHash only${NC}"
    echo "   Get free key at: https://serpapi.com"
    echo ""
fi

echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - ENV_SETUP.md - Detailed environment setup guide"
echo "   - backend/README.md - Backend documentation"
echo "   - DEPLOY_RASPBERRY_PI.md - Docker deployment guide"
echo ""

echo -e "${GREEN}Done! 🎉${NC}"

