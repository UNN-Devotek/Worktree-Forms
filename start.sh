#\!/bin/sh
set -e

echo "[start.sh] Starting backend on port ${BACKEND_PORT:-5005}..."
cd /app/apps/backend
PORT=${BACKEND_PORT:-5005} node dist/index.js &

echo "[start.sh] Starting frontend on port ${PORT:-3005}..."
cd /app/apps/frontend
HOSTNAME=0.0.0.0 PORT=${PORT:-3005} node server.js
