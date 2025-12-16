#!/bin/sh
set -e

echo "Starting deployment script..."

# Run database migrations for backend
echo "Running backend migrations..."
cd apps/backend
npx prisma migrate deploy
cd ../..

# Start application with PM2
echo "Starting application with PM2..."
pm2-runtime start ecosystem.config.js
