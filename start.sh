#\!/bin/sh
set -e

echo "[start.sh] Checking standalone structure..."
echo "--- /app/apps/frontend/ ---"
ls -la /app/apps/frontend/ 2>&1 || echo "  MISSING"
echo "--- /app/apps/frontend/.next/ ---"
ls -la /app/apps/frontend/.next/ 2>&1 | head -20 || echo "  MISSING"
echo "--- /app/apps/frontend/.next/required-server-files.json (first 500 chars) ---"
head -c 500 /app/apps/frontend/.next/required-server-files.json 2>&1 || echo "  MISSING"
echo ""
echo "--- /app/apps/frontend/.next/server/ ---"
ls /app/apps/frontend/.next/server/ 2>&1 | head -20 || echo "  MISSING"
echo "--- /app/node_modules/next/ ---"
ls /app/node_modules/next/package.json 2>&1 || echo "  MISSING"
echo ""

echo "[start.sh] Starting backend on port ${BACKEND_PORT:-5005}..."
cd /app/apps/backend
PORT=${BACKEND_PORT:-5005} node dist/index.js &

echo "[start.sh] Starting frontend on port ${PORT:-3005}..."
cd /app/apps/frontend
HOSTNAME=0.0.0.0 PORT=${PORT:-3005} node server.js
