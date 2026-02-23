# Operations Guide

## Backup Strategy

### PostgreSQL
Run the following to create a database backup:
```bash
docker exec worktree-db pg_dump -U ${POSTGRES_USER:-user} ${POSTGRES_DB:-worktree} > backup-$(date +%Y%m%d-%H%M%S).sql
```

Restore from backup:
```bash
docker exec -i worktree-db psql -U ${POSTGRES_USER:-user} ${POSTGRES_DB:-worktree} < backup-YYYYMMDD-HHMMSS.sql
```

### MinIO
Use the MinIO client (`mc`) to mirror the bucket:
```bash
mc alias set worktree http://localhost:9004 ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY}
mc mirror worktree/worktree /backup/minio/$(date +%Y%m%d)/
```

### Redis
Redis is used for ephemeral job queues only — no backup is required. Jobs will be re-queued on restart.

## Log Management

Container logs are automatically rotated: max 100MB per file, 5 files retained per container (500MB total per service). Logs are stored in Docker's default log directory.

View logs:
```bash
docker compose logs -f app          # application logs
docker compose logs -f db           # database logs
docker compose logs --tail=100 app  # last 100 lines
```
