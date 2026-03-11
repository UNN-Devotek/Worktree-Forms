#\!/bin/sh
set -e

# Start backend (Express) in background
cd /app/apps/backend
PORT=${BACKEND_PORT:-5005} node dist/index.js &

# Start frontend (Next.js) in foreground
cd /app/apps/frontend
HOSTNAME=0.0.0.0 PORT=${PORT:-3005} node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-3005}
