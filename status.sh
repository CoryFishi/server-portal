#!/bin/bash
# Quick status check for Server Portal

echo "📊 Server Portal Status"
echo "======================="
echo ""

# Check if systemd service is running
if systemctl is-active --quiet server-portal; then
    echo "✅ Service Status: RUNNING"
else
    echo "❌ Service Status: STOPPED"
fi

echo ""
echo "🐋 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "serverportal_|NAMES"

echo ""
echo "💾 Disk Usage (data folder):"
if [ -d "./data" ]; then
    du -sh ./data 2>/dev/null || echo "No data folder found"
else
    echo "No data folder found"
fi

echo ""
echo "🌐 Network Ports:"
sudo netstat -tlnp | grep -E "5000|25565" || echo "No listening ports found"

echo ""
echo "📋 Recent Logs (last 10 lines):"
sudo journalctl -u server-portal -n 10 --no-pager 2>/dev/null || echo "Service not found in journalctl"
