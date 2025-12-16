#!/bin/sh
# Do not set -e so we can logging errors without crashing immediately
# set -e

echo "Starting deployment script..."

# Run database migrations for backend
echo "Running backend migrations..."
cd apps/backend
npx prisma migrate deploy || echo "WARNING: Prisma migration failed. Check logs."
cd ../..

# Start application with PM2
echo "Starting application with PM2..."
pm2-runtime start ecosystem.config.js
