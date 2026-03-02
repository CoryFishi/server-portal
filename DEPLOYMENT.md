# 🚀 Production Deployment Guide

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/CoryFishi/server-portal
cd server-portal
```

### 2. Make Scripts Executable
```bash
chmod +x deploy-production.sh
chmod +x run-production.sh
```

### 3. Build for Production
```bash
./deploy-production.sh
```

### 4. Run the Application
```bash
./run-production.sh
```

The application will be available at `http://your-server-ip:5000`

---

## Detailed Setup

### Prerequisites

1. **Docker & Docker Compose**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **.NET 10 Runtime**
   ```bash
   wget https://dot.net/v1/dotnet-install.sh
   chmod +x dotnet-install.sh
   ./dotnet-install.sh --channel 10.0
   export PATH="$HOME/.dotnet:$PATH"
   ```

3. **Node.js** (only needed for building)
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

---

## Manual Build Steps

If you prefer to build manually:

### 1. Build Frontend
```bash
cd portal-ui
npm install
npm run build
cd ..
```

### 2. Build Backend
```bash
dotnet publish -c Release -o ./publish
```

### 3. Copy Frontend to Backend
```bash
mkdir -p ./publish/wwwroot
cp -r ./portal-ui/dist/* ./publish/wwwroot/
```

### 4. Run
```bash
cd publish
export ASPNETCORE_ENVIRONMENT=Production
dotnet server-portal.dll
```

---

## Running as a System Service

### 1. Install the Service
```bash
# Edit the service file first - update YOUR_USERNAME and paths
sudo nano server-portal.service

# Copy to systemd
sudo cp server-portal.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable server-portal

# Start the service
sudo systemctl start server-portal
```

### 2. Manage the Service
```bash
# Check status
sudo systemctl status server-portal

# View logs
sudo journalctl -u server-portal -f

# Restart
sudo systemctl restart server-portal

# Stop
sudo systemctl stop server-portal
```

---

## Using Nginx as Reverse Proxy (Recommended)

### 1. Install Nginx
```bash
sudo apt install -y nginx
```

### 2. Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/server-portal
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your server IP

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for SignalR
    location /hubs/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/server-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

---

## Environment Configuration

Create `.env` file in publish directory:
```bash
cp .env.example .env
nano .env
```

---

## Firewall Setup

```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# If not using Nginx, allow direct port
sudo ufw allow 5000/tcp

# Allow Minecraft server ports (example)
sudo ufw allow 25565/tcp

# Enable firewall
sudo ufw enable
```

---

## Monitoring & Logs

### Application Logs
```bash
# If running as service
sudo journalctl -u server-portal -f

# If running manually, logs are in:
tail -f ./publish/logs/app.log
```

### Docker Logs
```bash
# View running containers
docker ps

# View specific container logs
docker logs -f container_name
```

---

## Backup Strategy

### 1. Backup Data Directory
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/server-portal"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/data_$DATE.tar.gz ./publish/data
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup.sh") | crontab -
```

---

## Updating the Application

```bash
# 1. Stop the service
sudo systemctl stop server-portal

# 2. Pull latest code
git pull

# 3. Rebuild
./deploy-production.sh

# 4. Restart
sudo systemctl start server-portal
```

---

## Troubleshooting

### Application won't start
```bash
# Check logs
sudo journalctl -u server-portal -n 50

# Check permissions
ls -la ./publish

# Check .NET installation
dotnet --list-runtimes
```

### Can't connect to application
```bash
# Check if running
sudo systemctl status server-portal

# Check listening ports
sudo netstat -tlnp | grep 5000

# Check firewall
sudo ufw status
```

### Docker containers not starting
```bash
# Check Docker
sudo systemctl status docker

# Check docker-compose.yml
cd ./publish
docker-compose config

# View logs
docker-compose logs
```

---

## Performance Tuning

### For Production Use:

1. **Increase upload limits** (for large modpacks):
   Edit `appsettings.Production.json`:
   ```json
   {
     "Kestrel": {
       "Limits": {
         "MaxRequestBodySize": 5368709120
       }
     }
   }
   ```

2. **Enable response compression** (already built-in)

3. **Set up log rotation**:
   ```bash
   sudo nano /etc/logrotate.d/server-portal
   ```
   Add:
   ```
   /opt/server-portal/publish/logs/*.log {
       daily
       rotate 14
       compress
       delaycompress
       missingok
       notifempty
   }
   ```

---

## Security Checklist

- [ ] Change default passwords in docker-compose.yml
- [ ] Set up SSL certificate
- [ ] Configure firewall
- [ ] Keep system updated (`sudo apt update && sudo apt upgrade`)
- [ ] Set up automatic backups
- [ ] Use strong RCON passwords for Minecraft servers
- [ ] Consider setting up fail2ban
- [ ] Use non-root user for running the service

---

## Default Credentials

- **Application**: No login required by default
- **RCON Password**: Set in docker-compose.yml (default: "change-me" - CHANGE THIS!)

---

## Support

For issues, check:
1. Application logs: `sudo journalctl -u server-portal -f`
2. Docker logs: `docker-compose logs -f`
3. Nginx logs: `sudo tail -f /var/log/nginx/error.log`

---

## Architecture Overview

```
┌─────────────────┐
│   Nginx (80)    │  ← Public facing
└────────┬────────┘
         │
┌────────▼────────────┐
│  .NET Backend       │  ← Serves React app & API
│  (Port 5000)        │  ← Manages Docker containers
└────────┬────────────┘
         │
┌────────▼─────────────┐
│  Docker Containers   │  ← Minecraft servers
│  (Various ports)     │
└──────────────────────┘
```

---

## Quick Commands Reference

```bash
# Start
sudo systemctl start server-portal

# Stop
sudo systemctl stop server-portal

# Restart
sudo systemctl restart server-portal

# Status
sudo systemctl status server-portal

# Logs
sudo journalctl -u server-portal -f

# Rebuild & Deploy
./deploy-production.sh && sudo systemctl restart server-portal
```
