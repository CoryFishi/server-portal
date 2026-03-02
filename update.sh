#!/bin/bash
set -e

echo "🔄 Updating Server Portal..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if service is running
if systemctl is-active --quiet server-portal; then
    echo -e "${YELLOW}⏸️  Stopping service...${NC}"
    sudo systemctl stop server-portal
    SERVICE_WAS_RUNNING=true
else
    SERVICE_WAS_RUNNING=false
fi

# Pull latest changes
echo -e "${BLUE}📥 Pulling latest code from Git...${NC}"
git pull

# Rebuild application
echo -e "${BLUE}🔨 Rebuilding application...${NC}"
./deploy-production.sh

# Restart service if it was running
if [ "$SERVICE_WAS_RUNNING" = true ]; then
    echo -e "${BLUE}▶️  Starting service...${NC}"
    sudo systemctl start server-portal
fi

echo -e "${GREEN}✅ Update complete!${NC}"

# Show status
if systemctl is-active --quiet server-portal; then
    echo -e "${GREEN}✅ Service is running${NC}"
    sudo systemctl status server-portal --no-pager
else
    echo -e "${YELLOW}⚠️  Service is not running${NC}"
    echo "Start it with: sudo systemctl start server-portal"
fi
