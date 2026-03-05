# Project Context: Worktree

> [!IMPORTANT]
> **This is the Source of Truth.**
> All other documents are specialized views of the data indexed here.
> _Last Updated: 2026-03-05_

## 1. Executive Summary & Vision

**Worktree** is a cloud-hosted "Project Operating System" for field operations. It bridges the gap between back-office planning (Spreadsheets) and front-line execution (Mobile Forms).

- **Core Philosophy:** "Muddy Thumb" Usability.
  - If a technician cannot use it with one hand, in the rain, wearing gloves, **it is out**.
  - If an admin cannot execute a workflow in under 3 clicks, **it is too slow**.
- **The "One-Database" Promise:**
  - A Row in the spreadsheet = A Form on the phone = A Pin on the map.
  - Zero silos. Real-time sync.

## 2. Master Documentation Index

| ID     | Document Name                                                | Purpose                                                         | Audience           |
| :----- | :----------------------------------------------------------- | :-------------------------------------------------------------- | :----------------- |
| **00** | **[Project Context](./project-context.md)**                  | **You Are Here.** Global rules, index, and constraints.         | **ALL**            |
| **01** | **[Product Vision](./product-brief-Worktree-2026-01-09.md)** | High-level "Why", Market Fit, and Success Metrics.              | PM, Owner          |
| **02** | **[Product Requirements (PRD)](./prd.md)**                   | **WHAT** we are building. User Journeys, Functional Specs.      | Dev, PM, QA        |
| **03** | **[System Architecture](./architecture.md)**                 | **HOW** we build it. Tech Stack, Schema, API, Security.         | Dev, DevOps        |
| **04** | **[UX Design Spec](./ux-design-specification.md)**           | **LOOK & FEEL**. Component library, Visual Flows, Interactions. | Designer, Frontend |
| **05** | **[Research: Autodesk](./autodesk-build-analysis.md)**       | Competitive Analysis & Inspiration.                             | PM, Design         |

## 3. Global Project Constraints

### A. Technical Constraints

1.  **AWS Cloud Infrastructure:** Deployed on AWS managed services (ECS Fargate, DynamoDB, S3, ElastiCache, Pinecone). ~~No Cloud-Native dependencies~~ — _constraint removed 2026-03-05, strategic pivot to full AWS stack. OpenSearch Serverless replaced by Pinecone — see technical research 2026-03-05._
2.  **Resource Efficiency:** ECS task sizes right-sized per service. No single-server RAM constraint.
3.  **Offline-First:** The Mobile App MUST function 100% offline. Sync is an enhancement, not a requirement for usage.

### B. Design Constraints

1.  **Touch Targets:** Minimum **44px** (ideally 60px) for all field interactions.
2.  **Contrast:** "Day Mode" must be visible in direct sunlight (High Contrast).
3.  **Keyboard First:** Admin dashboard must be navigable via Keyboard Shortcuts.

### C. Implementation Rules (The "Law")

1.  **The Feature Rule:** All logic lives in `src/features/{domain}`. No loose files in `src/components` unless generic UI.
2.  **Verify Before Build:** Do not write code until the **Architecture** for that feature is approved in `architecture.md`.
3.  **Strict Types:** `noImplicitAny` is ON. Zod schemas required for ALL API inputs.

## 4. Current Phase: Implementation Readiness

We have consolidated the Product Plan and defined the Architecture.
**Next Step:** Execute against the **[Task Manifest](./tasks.md)** derived from the Epics.

## 5. Development Environment

_Last Updated: 2026-03-05 — updated for full AWS stack local emulation._

### Quick Start

```bash
docker compose up --watch    # starts all local services (DynamoDB, Redis, app, ws-server, worker)
# second terminal:
bash scripts/seed-dev.sh     # create tables + GSIs, seed dev users + sample data (idempotent)
```

### Local Service Map

| Service | Docker Image | Local Port | Notes |
|---|---|---|---|
| **App** (Next.js + API) | `app` (project Dockerfile) | `3005` | Frontend + REST API |
| **WS Server** (Hocuspocus) | `ws-server` (project Dockerfile) | `1234` | Real-time collab |
| **Worker** (BullMQ) | `worker` (project Dockerfile) | — | Background jobs |
| **DynamoDB Local** | `amazon/dynamodb-local` | `8100` | Full DynamoDB API emulation |
| **DynamoDB Admin UI** | `aaronshaf/dynamodb-admin` | `8101` | Browser table inspector |
| **Redis** | `redis:7` | `6380` | ElastiCache equivalent; exact protocol parity |
| **LocalStack** | `localstack/localstack` | `4510` | AWS S3 local emulation — no real credentials needed |
| **Pinecone Local** _(optional)_ | `pinecone-io/pinecone-local` | `5080` | In-memory vector emulator (100K record limit) |

### Service Notes

- **DynamoDB Local** must be started with `-sharedDb` flag — without it each process connection sees an isolated SQLite dataset. Critical for hot-reload scenarios.
- **Redis** must be configured with `maxmemory-policy noeviction` to match ElastiCache production config (required for BullMQ reliability).
- **S3 (LocalStack):** Runs fully locally at `http://localstack:4510`. No real AWS credentials needed for local dev. SDK requires `forcePathStyle: true` and fake credentials (any non-empty values). Seed script creates the `worktree-local` bucket on first run.
- **Pinecone:** Two options — run `pinecone-local` Docker container (no network required, ephemeral) OR use the real Pinecone free-tier API. Free tier supports up to 100K vectors/5 indexes at $0.
- **Next.js API routes** that use AWS SDK (DynamoDB, S3, Pinecone) must NOT use `export const runtime = 'edge'` — AWS SDK v3 requires Node.js runtime.

### Environment Variables (local)

All local overrides live in `.env.local` (gitignored). Key values:

```bash
DYNAMODB_ENDPOINT=http://dynamodb-local:8100   # Docker service name
DYNAMODB_REGION=us-east-1
DYNAMODB_TABLE_NAME=worktree-local
REDIS_URL=redis://redis:6380
# S3 — LocalStack (no real AWS credentials needed)
S3_ENDPOINT=http://localstack:4510
S3_BUCKET=worktree-local
# Pinecone — choose one:
PINECONE_API_KEY=local                          # if using pinecone-local container
PINECONE_HOST=http://pinecone-local:5080        # if using pinecone-local container
# OR: use real Pinecone free-tier key (no host override needed)
```

### Seed Data (`seed-dev.sh`)

Replaces the old Prisma `seed-dev.sh`. Runs in order, fully idempotent — safe to re-run at any time:

1. **Create S3 bucket in LocalStack** — `worktree-local` bucket at `http://localstack:4510` (skips if exists)
2. **Create DynamoDB table** with correct KeySchema and all GSIs (skips if exists)
3. **Seed dev users** (`admin@worktree.pro` OWNER, `user@worktree.com` MEMBER) with bcrypt-hashed passwords
4. **Seed sample project** with Forms, Sheets (with columns), and Routes for UI development
5. **Seed NextAuth adapter records** so dev users can log in immediately without registering

All DynamoDB writes use `ConditionExpression: "attribute_not_exists(PK)"` — re-runs never overwrite or duplicate existing data.

### Workflow

- Use `docker compose up --watch` — Compose Watch syncs file changes without polling overhead.
- Use `docker compose down` to stop. Use `docker compose down -v` for a clean slate (wipes DynamoDB SQLite data).
- DynamoDB Admin UI at `http://localhost:8101` — inspect tables, run queries, verify seed data.
