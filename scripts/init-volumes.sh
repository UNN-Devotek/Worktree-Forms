#!/usr/bin/env bash
set -e

echo "Initializing Worktree persistent volumes..."

for vol in worktree_postgres_data worktree_redis_data worktree_minio_data; do
  if docker volume inspect "$vol" > /dev/null 2>&1; then
    echo "  ✓ $vol already exists"
  else
    docker volume create "$vol"
    echo "  + $vol created"
  fi
done

echo "Done. Run: docker compose up --watch"
