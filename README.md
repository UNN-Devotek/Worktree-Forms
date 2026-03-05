# Worktree — Project Operating System for Field Operations

**Last Updated**: 2026-03-05
**Stack**: Next.js · AWS DynamoDB · S3 · ElastiCache · Pinecone · ECS Fargate

---

## What We're Building

Worktree bridges back-office planning and front-line execution for field operations teams.

**Core promise**: A Row in the spreadsheet = A Form on the phone = A Pin on the map. Zero silos. Real-time sync.

---

## Quick Links

- 🏗️ [Architecture](./\_bmad-output/planning-artifacts/architecture.md) — Tech stack, data model, infrastructure
- 📋 [Project Context](./\_bmad-output/planning-artifacts/project-context.md) — Constraints, dev environment, rules
- 📖 [Epics & Stories](./\_bmad-output/planning-artifacts/epics.md) — Feature backlog
- 📊 [Sprint Status](./\_bmad-output/implementation-artifacts/sprint-status.yaml) — Story tracking
- 🤖 [Claude Guide](./CLAUDE.md) — Daily dev reference for Claude Code
- 🤖 [Gemini Guide](./GEMINI.md) — Daily dev reference for Gemini CLI

---

## Tech Stack

### Frontend
- **Next.js App Router** (TypeScript, strict mode)
- **shadcn/ui** + Tailwind CSS
- **Yjs + Hocuspocus** — real-time collaborative Smart Grid (CRDT)
- **Vercel AI SDK** — global AI assistant

### Backend / API
- **Express.js** REST API (versioned, for mobile sync)
- **Next.js Server Actions** (web dashboard mutations)
- **BullMQ** — background job queue (PDF parsing, webhooks, image optimization)

### Data & Storage
- **AWS DynamoDB + ElectroDB** — single-table design, no SQL, no migrations
- **Auth.js v5 + `@auth/dynamodb-adapter`** — database sessions, instant revocation
- **AWS S3** — file storage (presigned URLs, no public access)
- **AWS ElastiCache for Redis 7** — BullMQ queues + Hocuspocus pub-sub
- **Pinecone** — vector search for AI RAG (free tier → pay-per-use)

### Infrastructure
- **AWS ECS Fargate** — 3 services: `app`, `ws-server`, `worker`
- **AWS CDK TypeScript** — infrastructure as code
- **GitHub Actions OIDC** — CI/CD to ECR → ECS

---

## Local Development

### Prerequisites

- Docker Desktop running
- `.env.local` configured (copy from `.env.example`)

### Quick Start

```bash
# 1. Configure
cp .env.example .env.local
# Fill in: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, PINECONE_API_KEY, AUTH_SECRET

# 2. Start all local services
docker compose up --watch

# 3. Seed dev data (second terminal)
bash scripts/seed-dev.sh

# 4. Open
# App:               http://localhost:3005
# DynamoDB Admin UI: http://localhost:8001
```

### Dev Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@worktree.pro | password |
| Member | user@worktree.com | password |

### Local Services

| Service | Port | Notes |
|---|---|---|
| App (Next.js + API) | 3005 | |
| Hocuspocus WS | 1234 | Real-time Smart Grid |
| DynamoDB Local | 8000 | Full API emulation |
| DynamoDB Admin UI | 8001 | Browser table inspector |
| Redis | 6379 | ElastiCache equivalent |
| Pinecone Local (optional) | 5080 | In-memory vector emulator |

> S3 connects to a real AWS dev bucket (`worktree-dev`). Pinecone uses the real free-tier API by default.

---

## Project Structure

```
worktree/
├── apps/
│   ├── frontend/               # Next.js App Router
│   │   ├── app/
│   │   │   ├── (auth)/        # Login / Signup
│   │   │   ├── (dashboard)/   # Protected workspace
│   │   │   └── api/           # Route handlers
│   │   ├── features/          # Domain modules (forms, sheets, routing, ...)
│   │   ├── components/ui/     # shadcn/ui components
│   │   └── lib/               # SDK clients (dynamodb, s3, redis, pinecone)
│   └── backend/               # Express REST API (mobile sync)
│       └── src/
│           ├── entities/      # ElectroDB entity definitions
│           ├── repositories/  # Data access layer
│           ├── routes/
│           └── middleware/    # auth, rbac (requireProjectAccess)
├── scripts/
│   └── seed-dev.sh            # DynamoDB table creation + dev data seed
├── docker-compose.yml
├── .env.example
└── _bmad-output/              # Planning & architecture documents
```

---

## Development Rules

1. **Feature Rule** — All logic in `features/{domain}`. No loose files in `components/`.
2. **Verify Before Build** — Architecture must be in `architecture.md` before writing code.
3. **Strict Types** — `noImplicitAny` ON. Zod for all API inputs.
4. **No mocking DynamoDB** — use `vitest-dynalite` for real integration tests.
5. **Scope all DB calls** — `requireProjectAccess()` before every DynamoDB operation.
6. **No migrations** — ElectroDB entity definitions are the schema contract.
7. **Node.js runtime only** for AWS SDK routes — never `export const runtime = 'edge'`.

---

## Deployment

Push to `main` → GitHub Actions builds → pushes to ECR → deploys to ECS Fargate automatically.

```bash
git push origin main
# Verify:
curl https://worktree.pro/api/health
```

---

## Security

- Bcrypt password hashing (10+ rounds)
- Auth.js database sessions (instant server-side revocation)
- Application-layer tenant isolation (all DynamoDB queries scoped by `projectId`)
- S3 private bucket — presigned URLs only, no public access
- HTTPS via ALB TLS termination
- Input validation (Zod) on all endpoints
- Rate limiting on auth endpoints
