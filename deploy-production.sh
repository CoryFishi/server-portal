#!/bin/bash
set -e

echo "🚀 Building Server Portal for Production..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Build Frontend
echo -e "${BLUE}📦 Building Frontend...${NC}"
cd portal-ui
npm install
npm run build
cd ..

# 2. Build Backend
echo -e "${BLUE}🔨 Building Backend...${NC}"
dotnet publish -c Release -o ./publish

# 3. Copy frontend build to backend wwwroot
echo -e "${BLUE}📋 Copying frontend to backend...${NC}"
rm -rf ./publish/wwwroot
mkdir -p ./publish/wwwroot
cp -r ./portal-ui/dist/* ./publish/wwwroot/

# 4. Create data directory
echo -e "${BLUE}📁 Creating data directory...${NC}"
mkdir -p ./data

# 5. Copy docker-compose if it exists
if [ -f "docker-compose.yml" ]; then
    echo -e "${BLUE}🐋 Copying docker-compose.yml...${NC}"
    cp docker-compose.yml ./publish/
fi

echo -e "${GREEN}✅ Build complete! Files are in ./publish${NC}"
echo ""
echo -e "${YELLOW}To run in production:${NC}"
echo "  cd publish"
echo "  dotnet server-portal.dll"
echo ""
echo -e "${YELLOW}Or use the run script:${NC}"
echo "  ./run-production.sh"
