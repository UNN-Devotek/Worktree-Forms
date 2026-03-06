#!/bin/sh
set -e

echo "Starting deployment script..."

echo "Starting application with PM2..."
exec pm2-runtime start ecosystem.config.js
