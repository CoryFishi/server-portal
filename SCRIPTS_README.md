# Server Portal - Production Scripts

This directory contains scripts for managing your Server Portal installation in production.

## 🚀 Deployment Scripts

### `deploy-production.sh`
Builds the entire application for production.
```bash
./deploy-production.sh
```
- Builds React frontend
- Builds .NET backend
- Combines into `./publish` directory
- Creates necessary folders

### `run-production.sh`
Runs the application in production mode.
```bash
./run-production.sh
```
- Sets production environment variables
- Starts the .NET application on port 5000

## 🔄 Management Scripts

### `update.sh`
Updates the application from Git.
```bash
./update.sh
```
- Stops the service (if running)
- Pulls latest code
- Rebuilds application
- Restarts service
- Shows status

### `status.sh`
Shows current status of everything.
```bash
./status.sh
```
- Service status
- Docker containers
- Disk usage
- Network ports
- Recent logs

### `backup.sh`
Creates backups of your data.
```bash
./backup.sh
```
- Backs up `./data` folder
- Backs up `docker-compose.yml`
- Keeps backups for 7 days
- Stores in `/opt/backups/server-portal`

## 🔧 Configuration Files

### `appsettings.Production.json`
Production configuration for the .NET application.
- Sets logging levels
- Configures Kestrel limits (5GB max upload)
- Sets listening URLs

### `.env.example`
Template for environment variables.
```bash
cp .env.example .env
nano .env
```

### `server-portal.service`
Systemd service file.
```bash
# Edit and install
sudo nano server-portal.service
sudo cp server-portal.service /etc/systemd/system/
sudo systemctl enable server-portal
sudo systemctl start server-portal
```

## 📋 Quick Start

```bash
# 1. Make scripts executable
chmod +x *.sh

# 2. Build for production
./deploy-production.sh

# 3. Run the application
./run-production.sh

# Or install as service:
sudo cp server-portal.service /etc/systemd/system/
sudo systemctl enable server-portal
sudo systemctl start server-portal
```

## 🔄 Daily Operations

```bash
# Check status
./status.sh

# Update to latest version
./update.sh

# Create backup
./backup.sh

# View logs
sudo journalctl -u server-portal -f
```

## 📅 Automated Backups

Add to crontab for daily backups at 2 AM:
```bash
crontab -e
# Add this line:
0 2 * * * /path/to/server-portal/backup.sh
```

## 🆘 Troubleshooting

### Application won't start
```bash
# Check logs
sudo journalctl -u server-portal -n 50

# Check .NET runtime
dotnet --list-runtimes
```

### Need to rebuild
```bash
# Clean rebuild
rm -rf ./publish
./deploy-production.sh
```

### Service issues
```bash
# Restart service
sudo systemctl restart server-portal

# Check status
sudo systemctl status server-portal
```

---

See `DEPLOYMENT.md` for complete production deployment guide.
