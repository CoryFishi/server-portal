#!/bin/bash
set -e

echo "🎮 Starting Server Portal in Production Mode..."

# Change to publish directory
cd publish

# Set production environment
export ASPNETCORE_ENVIRONMENT=Production
export ASPNETCORE_URLS="http://0.0.0.0:5000"

# Run the application
echo "🚀 Server starting on http://0.0.0.0:5000"
dotnet server-portal.dll
