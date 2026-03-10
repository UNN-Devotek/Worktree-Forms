#!/bin/sh
set -e

# Start backend (Express) in background
cd /app/apps/backend
PORT=${BACKEND_PORT:-5005} node dist/index.js &

# Start frontend (Next.js standalone server) in foreground
cd /app/apps/frontend-standalone/apps/frontend
HOSTNAME=0.0.0.0 PORT=${PORT:-3005} node server.js
