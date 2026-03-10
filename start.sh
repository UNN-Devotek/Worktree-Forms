#!/bin/sh
set -e

echo "Starting Worktree via PM2..."
pm2-runtime ecosystem.config.js
