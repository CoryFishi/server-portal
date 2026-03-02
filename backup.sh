#!/bin/bash
set -e

echo "💾 Backing up Server Portal data..."

# Configuration
BACKUP_DIR="/opt/backups/server-portal"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup directory
mkdir -p $BACKUP_DIR

echo -e "${BLUE}📦 Creating backup archive...${NC}"

# Backup data directory
if [ -d "./data" ]; then
    tar -czf $BACKUP_DIR/data_$DATE.tar.gz ./data
    echo -e "${GREEN}✅ Data backed up to: $BACKUP_DIR/data_$DATE.tar.gz${NC}"
fi

# Backup docker-compose.yml
if [ -f "./docker-compose.yml" ]; then
    cp ./docker-compose.yml $BACKUP_DIR/docker-compose_$DATE.yml
    echo -e "${GREEN}✅ Docker compose backed up${NC}"
fi

# Clean old backups (older than RETENTION_DAYS)
echo -e "${BLUE}🧹 Cleaning old backups (older than $RETENTION_DAYS days)...${NC}"
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "docker-compose_*.yml" -mtime +$RETENTION_DAYS -delete

echo -e "${GREEN}✅ Backup complete!${NC}"
