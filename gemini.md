# Worktree — Gemini Development Guide

**Last Updated**: 2026-03-05
**Stack**: Next.js + AWS (DynamoDB, S3, ElastiCache, Pinecone) + ECS Fargate

---

## Project Overview

**Worktree** is a cloud-hosted "Project Operating System" for field operations — bridging back-office planning (spreadsheets) with front-line execution (mobile forms). Core promise: a row in the spreadsheet = a form on the phone = a pin on the map.

- **Frontend**: Next.js App Router (TypeScript, strict mode)
- **Database**: AWS DynamoDB + ElectroDB ODM (single-table design, no SQL, no migrations)
- **Auth**: Auth.js (NextAuth v5) + `@auth/dynamodb-adapter`
- **Storage**: AWS S3 (presigned URLs, no public bucket access)
- **Cache / Queues**: AWS ElastiCache for Redis 7 (BullMQ + Hocuspocus pub-sub)
- **Vector Search**: Pinecone (RAG for AI assistant)
- **Real-time**: Hocuspocus WebSocket server (Yjs CRDT for Smart Grid collaboration)
- **Production**: AWS ECS Fargate (3 services: `app`, `ws-server`, `worker`)
- **CI/CD**: GitHub Actions → ECR → ECS rolling deploy

---

## Local Development

### Quick Start

```bash
cp .env.example .env.local        # no real AWS credentials needed for local dev
docker compose up --watch         # starts DynamoDB Local, Redis, LocalStack S3, app, ws-server, worker
bash scripts/seed-dev.sh          # creates S3 bucket + DynamoDB tables + seeds dev data (idempotent)
```

- **Frontend**: http://localhost:3005
- **DynamoDB Admin UI**: http://localhost:8101
- **Dev credentials**: `admin@worktree.pro / password` | `user@worktree.com / password`

### Local Service Map

| Service                   | Image                        | Port |
| ------------------------- | ---------------------------- | ---- |
| App (Next.js + API)       | Project Dockerfile           | 3005 |
| WS Server (Hocuspocus)    | Project Dockerfile           | 1234 |
| Worker (BullMQ)           | Project Dockerfile           | —    |
| DynamoDB Local            | `amazon/dynamodb-local`      | 8100 |
| DynamoDB Admin            | `aaronshaf/dynamodb-admin`   | 8101 |
| Redis                     | `redis:7`                    | 6380 |
| LocalStack (S3)           | `localstack/localstack`      | 4510 |
| Pinecone Local (optional) | `pinecone-io/pinecone-local` | 5080 |

### Key Environment Variables (`.env.local`)

```bash
DYNAMODB_ENDPOINT=http://dynamodb-local:8100   # Docker service name — NOT localhost
DYNAMODB_TABLE_NAME=worktree-local
REDIS_URL=redis://redis:6380
# S3 — LocalStack (no real AWS credentials needed)
S3_ENDPOINT=http://localstack:4510
S3_BUCKET=worktree-local
AWS_ACCESS_KEY_ID=local                         # fake creds — LocalStack accepts anything
AWS_SECRET_ACCESS_KEY=local
AWS_REGION=us-east-1
# Pinecone — real free-tier key OR local container
PINECONE_API_KEY=[real free-tier key OR 'local' for local container]
# PINECONE_HOST=http://pinecone-local:5080      # uncomment if using local container
AUTH_SECRET=[32+ chars]
NEXTAUTH_URL=http://localhost:3005
```

> **Critical**: DynamoDB Local must start with `-sharedDb` flag. Without it, hot-reload forks see isolated datasets.
> **Critical**: Redis must use `maxmemory-policy noeviction` (required for BullMQ).
> **Critical**: S3 client needs `forcePathStyle: true` when `S3_ENDPOINT` is set (LocalStack requires path-style addressing).
> **Critical**: Never add `export const runtime = 'edge'` to routes using AWS SDK — Node.js runtime only.

---

## Architecture Rules (The Law)

1. **Feature Rule**: All logic in `apps/frontend/features/{domain}`. No loose files in `components/`.
2. **Verify Before Build**: Architecture must be approved in `_bmad-output/planning-artifacts/architecture.md` before writing code.
3. **Strict Types**: `noImplicitAny` ON. Zod schemas required for ALL API inputs. **NEVER use `as any`. NEVER use `@ts-expect-error` or `eslint-disable-next-line` without architectural approval.**
4. **Never mock DynamoDB SDK**: Use `vitest-dynalite` for integration tests — run real queries.
5. **All DB calls scoped**: Every DynamoDB query passes through `requireProjectAccess(userId, projectId, role)` first.
6. **No migrations**: DynamoDB is schema-less. ElectroDB entity definitions are the schema contract.
7. **Defensive Next.js Styling**: NEVER use hardcoded hex colors (`#FFFFFF`) or arbitrary z-indexes (`z-[999]`); rely strictly on `globals.css` scales. NEVER interpolate tailwind classes via strings (`className={\`...\`}`); use `cn(...)`.
8. **No Unmanaged Browser Operations**: NEVER utilize `window.localStorage` or raw `fetch(...)` arbitrarily. State relies on Context/Zustand wrappers, and data fetches use server actions or centralized clients. NEVER use raw `<a>` tags; use `<Link>`.
9. **No Silent UI Failures**: NEVER `return null;` as a fail-safe against broken props. Map failures to Skeletons or application `<ErrorBoundary>` wrappers.

---

## Tech Stack Summary

| Concern       | Decision                                     |
| ------------- | -------------------------------------------- |
| Language      | TypeScript (strict)                          |
| Frontend      | Next.js App Router                           |
| Components    | shadcn/ui + Tailwind CSS                     |
| Database      | AWS DynamoDB + ElectroDB                     |
| Auth          | Auth.js v5 + `@auth/dynamodb-adapter`        |
| Storage       | AWS S3 (`@aws-sdk/client-s3`)                |
| Cache/Queues  | ElastiCache Redis 7 / BullMQ                 |
| Vector Search | Pinecone (`@pinecone-database/pinecone` v5+) |
| Real-time     | Hocuspocus + Yjs CRDT                        |
| Testing       | Vitest + vitest-dynalite + Playwright        |
| IaC           | AWS CDK TypeScript                           |
| CI/CD         | GitHub Actions OIDC → ECR → ECS              |

---

## Data Architecture

- **Single-table DynamoDB design** — all entities in one table `worktree-{env}`
- **Partition key**: `PK` — pattern `PROJECT#<projectId>` for project-scoped entities
- **Sort key**: `SK` — pattern `<ENTITY_TYPE>#<entityId>`
- **Multi-tenancy**: Application-layer isolation via `requireProjectAccess()` middleware
- **No RLS, no triggers**: All enforcement is code-level

See `_bmad-output/planning-artifacts/architecture.md` for the full entity reference (pending Story 0.1 completion).

---

## Key File Locations

| File                                                       | Purpose                                 |
| ---------------------------------------------------------- | --------------------------------------- |
| `_bmad-output/planning-artifacts/architecture.md`          | Full system architecture                |
| `_bmad-output/planning-artifacts/project-context.md`       | Project constraints + dev environment   |
| `_bmad-output/planning-artifacts/epics.md`                 | Feature epics and stories               |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Story status tracking                   |
| `scripts/seed-dev.sh`                                      | DynamoDB table creation + dev data seed |
| `apps/frontend/lib/dynamodb.ts`                            | DynamoDB client (endpoint-switched)     |
| `apps/frontend/lib/s3.ts`                                  | S3 client                               |
| `apps/backend/src/entities/`                               | ElectroDB entity definitions            |
| `apps/backend/src/middleware/rbac.ts`                      | `requireProjectAccess()`                |

---

## S3 File Handling

Files are NOT served from public S3/LocalStack URLs. Pattern:

1. Client requests presigned PUT URL from backend → uploads directly to S3/LocalStack
2. Client requests presigned GET URL from backend → redirects (302) to it
3. All files tracked in `FileUpload` DynamoDB entity (`objectKey`, `projectId`, `submissionId`)

**Seed script creates the S3 bucket** in LocalStack as step 1 before any DynamoDB operations.

## Seed Data (`seed-dev.sh`)

5-step idempotent script (safe to re-run after `docker compose down -v`):

1. Create `worktree-local` bucket in LocalStack S3
2. Create DynamoDB table with KeySchema + all GSIs
3. Seed `admin@worktree.pro` (OWNER) + `user@worktree.com` (MEMBER) with bcrypt passwords
4. Seed sample Project with Form, Sheet (columns), Route
5. Seed `@auth/dynamodb-adapter` session records for immediate dev login

---

## Commit Conventions

```
feat: add user login functionality
fix: resolve DynamoDB query scope issue
docs: update architecture with ElectroDB entity design
test: add vitest-dynalite integration tests for FormEntity
refactor: extract S3 presigned URL service
chore: update @aws-sdk packages
```

---

## Production (ECS Fargate)

- 3 ECS services: `app` (port 3005), `ws-server` (port 1234), `worker` (no HTTP)
- DynamoDB, S3, ElastiCache, Pinecone are all AWS managed — no containers for these in production
- `DYNAMODB_ENDPOINT` must NOT be set in production (its absence routes SDK to real AWS DynamoDB)
- `S3_ENDPOINT` must NOT be set in production (its absence routes SDK to real AWS S3)
- Deploy via `git push origin main` → GitHub Actions handles everything
