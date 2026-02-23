#!/usr/bin/env bash
# Run migrations, regenerate Prisma client, and seed dev data inside the running Docker container.
# Safe to re-run — all operations are idempotent.
# Usage: bash scripts/seed-dev.sh
set -e

CONTAINER="Worktree"

echo "=== Worktree Dev Database Setup ==="
echo ""

# Resolve any failed migrations first
echo "Checking migration state..."
docker exec "$CONTAINER" sh -c "cd apps/backend && npx prisma migrate status 2>&1" | grep -q "failed" && \
  docker exec "$CONTAINER" sh -c "cd apps/backend && npx prisma migrate resolve --rolled-back \$(npx prisma migrate status 2>&1 | grep 'failed' | awk '{print \$1}')" || true

# Deploy migrations
echo "Deploying migrations..."
docker exec "$CONTAINER" sh -c "cd apps/backend && npx prisma migrate deploy"

echo ""

# Regenerate Prisma client so Next.js picks up schema changes
echo "Regenerating Prisma client..."
docker exec "$CONTAINER" sh -c "cd apps/backend && npx prisma generate"

echo ""

# Seed dev data (users with passwords, demo project, contact form)
echo "Seeding dev data..."
docker exec "$CONTAINER" sh -c "npm run seed"

echo ""
echo "==================================="
echo "Ready!"
echo "  Dev Admin:  admin@worktree.pro  / password"
echo "  Dev User:   user@worktree.com   / password"
echo ""
echo "NOTE: Restart the app container to pick up the"
echo "      regenerated Prisma client:"
echo "  docker restart $CONTAINER"
echo "==================================="
