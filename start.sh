#!/bin/sh
set -e

echo "Starting deployment script..."

echo "Running backend migrations..."
cd apps/backend
if ! npx prisma migrate deploy; then
  echo "ERROR: Database migration failed. Aborting startup."
  exit 1
fi
cd ../..

echo "Starting application with PM2..."
exec pm2-runtime start ecosystem.config.js
