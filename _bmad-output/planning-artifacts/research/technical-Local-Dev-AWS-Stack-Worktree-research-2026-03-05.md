---
stepsCompleted: [1, 2]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Local Development Environment for Worktree AWS Stack'
research_goals: 'Determine how to maintain a productive local development environment when the production stack uses AWS managed services — DynamoDB Local, Redis/ElastiCache equivalents, S3 alternatives, Pinecone alternatives, and local container orchestration'
user_name: 'White'
date: '2026-03-05'
web_research_enabled: true
source_verification: true
---

# Research Report: Technical

**Date:** 2026-03-05
**Author:** White
**Research Type:** Technical

---

## Research Overview

**Research Topic:** Local Development Environment for Worktree AWS Stack
**Research Goals:** Determine how to maintain a productive local development environment when the production stack uses AWS managed services — DynamoDB Local, Redis/ElastiCache equivalents, S3 alternatives, Pinecone alternatives, local container orchestration, and seed data strategy.

---

## Technical Research Scope Confirmation

**Research Topic:** Local Development Environment for Worktree AWS Stack
**Research Goals:** Determine how to maintain a productive local development environment when the production stack uses AWS managed services — DynamoDB Local, Redis/ElastiCache equivalents, S3 alternatives, Pinecone alternatives, and local container orchestration.

**Technical Research Scope:**

- Architecture Analysis — local vs. cloud parity patterns, what can be emulated vs. what needs a real cloud connection
- Implementation Approaches — Docker Compose setup, environment variable switching, tooling choices
- Technology Stack — DynamoDB Local, S3 equivalent, Pinecone test environment, Redis
- Integration Patterns — endpoint switching between local and cloud; `.env` strategy
- Performance Considerations — local emulator limitations, dev/prod parity gaps
- Seed Data Strategy — replacing `seed-dev.sh` (Prisma-based) with DynamoDB seed script; bootstrapping tables + GSIs, seeding dev users and sample project data, idempotent re-run behavior

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-03-05

---

<!-- Content will be appended sequentially through research workflow steps -->

---

## Technology Stack Analysis

### Programming Languages

The local development environment for the Worktree AWS stack runs entirely on **TypeScript** — the same language used in production. This eliminates any language-parity risk between local and deployed code.

_Popular Languages:_ TypeScript (primary), JavaScript (tooling scripts), Bash/Shell (seed scripts, init scripts)
_Language Evolution:_ TypeScript 5.x strict mode is now the de-facto standard for full-stack Node.js development. All AWS SDK v3 packages ship first-class TypeScript types.
_Performance Characteristics:_ Node.js 20+ LTS (Iron) is recommended for local dev to match the ECS Fargate runtime. `tsx` (TypeScript execute) enables direct execution of `.ts` seed scripts without a build step.
_Source:_ [amazon/dynamodb-local Docker Image](https://hub.docker.com/r/amazon/dynamodb-local)

---

### Development Frameworks and Libraries

| Service | Local Equivalent | Notes |
|---|---|---|
| **DynamoDB** | `amazon/dynamodb-local` (Docker) | Official AWS image; stores data in SQLite file |
| **S3** | LocalStack Community OR real AWS dev bucket | LocalStack free tier supports S3; real dev bucket is simpler if internet is reliable |
| **Redis/ElastiCache** | `redis:7` Docker image | ElastiCache max supported version is Redis 7.1; exact image parity |
| **Pinecone** | `pinecone-io/pinecone-local` (Docker) | **Official Pinecone local emulator** — in-memory, 100K record limit, no persistence |
| **BullMQ** | Same — uses the local Redis container | Zero changes required |
| **Hocuspocus** | Same — uses local Redis for pub-sub | Local Redis handles the Redis Extension |
| **NextAuth** | Same — points to DynamoDB Local endpoint | `@auth/dynamodb-adapter` accepts custom endpoint env var |

_Major Frameworks:_ ElectroDB (DynamoDB ODM), `@aws-sdk/client-dynamodb` v3, `@aws-sdk/client-s3` v3, `@pinecone-database/pinecone` v5.x+
_Ecosystem Maturity:_ All AWS SDK v3 clients support `endpoint` override for local emulators; this is the standard pattern.
_Source:_ [Pinecone Local Development Docs](https://docs.pinecone.io/guides/operations/local-development), [ElectroDB GitHub](https://github.com/tywalch/electrodb)

---

### Database and Storage Technologies

**DynamoDB Local**
- Ships as `amazon/dynamodb-local` Docker image (official, maintained by AWS)
- Stores all table data in an SQLite `.db` file inside the container
- Supports `-sharedDb` flag — critical when multiple processes or init containers create/query tables; without it each connection sees a different dataset
- Supports `-dbPath` flag for mounting a volume so data persists across restarts
- Exposes the full DynamoDB API on port `8000`; no API-level differences from production DynamoDB for standard operations
- Limitation: does not support DynamoDB Streams, DAX, or Global Tables
- `dynamodb-admin` (community GUI, port 8001) provides a browser-based table inspector — a significant DX improvement over AWS Console during local dev

_Source:_ [AWS DynamoDB Local Docs](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html), [Docker Compose DynamoDB Local Guide](https://medium.com/platform-engineer/running-aws-dynamodb-local-with-docker-compose-6f75850aba1e)

**S3 Storage (Local)**
- **Option A — LocalStack Community:** Emulates S3 API at `http://localhost:4566`; `forcePathStyle: true` required in SDK config; works fully offline; supports presigned URLs
- **Option B — Real AWS Dev Bucket:** Use a dedicated `worktree-dev-{env}` S3 bucket in a sandbox AWS account; simplest path, no emulation gap; requires internet; costs are negligible for dev data volumes
- **Recommendation for Worktree:** Use a real AWS dev bucket (Option B). Offline dev for S3 is not a stated requirement; LocalStack adds operational overhead without meaningful benefit for this team size.

_Source:_ [LocalStack S3 Docs](https://docs.localstack.cloud/aws/services/s3/), [Docker Docs: AWS development with LocalStack](https://docs.docker.com/guides/localstack/), [LocalStack S3 Comparison](https://blog.localstack.cloud/2024-04-08-exploring-s3-mocking-tools-a-comparative-analysis-of-s3mock-minio-and-localstack/)

**Pinecone Local**
- **Official Docker image:** `pinecone-io/pinecone-local` (in-memory emulator)
- Requires Node.js SDK v5.x or later (matches production requirement)
- Max 100,000 records per index — sufficient for dev/test seed data
- Data does **not** persist after container stops — seed data must be re-loaded on each `docker compose up`
- Exposes Pinecone-compatible REST API; environment variable `PINECONE_API_KEY` and `PINECONE_HOST` are overridden to point at local container
- **Alternative:** Use the real Pinecone free tier (Serverless, 1 project, 5 indexes, ~100K vectors free). For Worktree's dev use case this may be simpler than running the local container.

_Source:_ [Pinecone Local Development Docs](https://docs.pinecone.io/guides/operations/local-development)

**Redis (ElastiCache Equivalent)**
- `redis:7` official Docker image is the exact OSS base for ElastiCache Redis 7.1
- Valkey (`valkey/valkey`) is AWS's open-source Redis fork — also a valid alternative
- Zero code changes required; BullMQ and Hocuspocus connect via `REDIS_URL` environment variable
- ElastiCache cluster mode is NOT required for local dev — standalone Redis is sufficient
- `maxmemory-policy: noeviction` must be configured for BullMQ reliability (matches production ElastiCache config)

_Source:_ [Redis Docker Hub](https://hub.docker.com/_/redis), [ElastiCache Vs. Redis Comparison](https://www.cloudzero.com/blog/elasticache-vs-redis/)

---

### Development Tools and Platforms

**Testing — vitest-dynalite**
- [vitest-dynalite](https://github.com/GeertWille/vitest-dynalite) is a Vitest preset that spins up Dynalite (a lightweight in-memory DynamoDB emulator) per test runner process
- Accepts standard DynamoDB table config (KeySchema, AttributeDefinitions, BillingMode, GSIs)
- Supports `@aws-sdk/client-dynamodb` v3 (as of v3.3.0)
- Recommended pattern: never mock the DynamoDB SDK; run real queries against Dynalite in tests
- Alternative: `testcontainers` with the `dynalite` module for heavier integration tests needing full DynamoDB Local

_Source:_ [vitest-dynalite GitHub](https://github.com/GeertWille/vitest-dynalite), [DynamoDB Vitest Integration Guide](https://conermurphy.com/blog/master-dynamodb-integration-testing-vitest-docker-guide/)

**Admin / DX Tools**
- `dynamodb-admin` — browser GUI for DynamoDB Local (community, runs on port 8001); inspect tables, scan items, run queries
- AWS NoSQL Workbench — official AWS desktop app for data modeling and local DynamoDB inspection
- `awslocal` CLI (LocalStack companion) — if LocalStack S3 is chosen

**Environment Switching**
- All AWS SDK clients accept `endpoint` override; local dev sets `DYNAMODB_ENDPOINT=http://dynamodb-local:8000`
- `.env.local` (gitignored) holds all local overrides; `.env.example` documents all required keys
- `NODE_ENV=development` gates which endpoint the SDK factory selects

---

### Cloud Infrastructure and Deployment

The local Docker Compose stack mirrors the ECS Fargate production topology:

| ECS Service | Local Docker Container | Port |
|---|---|---|
| `app` (Next.js + API) | `app` | 3005 |
| `ws-server` (Hocuspocus) | `ws-server` | 1234 |
| `worker` (BullMQ) | `worker` | — (no HTTP) |
| DynamoDB | `dynamodb-local` | 8000 |
| DynamoDB Admin UI | `dynamodb-admin` | 8001 |
| Redis | `redis` | 6379 |
| Pinecone Local _(optional)_ | `pinecone-local` | 5080 |

Container inter-service communication uses Docker Compose service names (e.g., `dynamodb-local:8000`), matching the ECS Service Connect DNS pattern used in production.

_Source:_ [Docker Docs: AWS development with LocalStack](https://docs.docker.com/guides/localstack/), [DynamoDB Local Docker Compose Gist](https://gist.github.com/cmackenzie1/92e0c3628da6842f0e9ffeca8abbe170)

---

### Technology Adoption Trends

_Migration Patterns:_ Teams migrating from Prisma/PostgreSQL to DynamoDB/ElectroDB follow the "endpoint override" pattern — the same application code runs locally and in production, with only environment variables changing. This is the dominant pattern for local DynamoDB development in 2025.

_Emerging Technologies:_ `dynalite` (used by vitest-dynalite) is being supplemented by `testcontainers` for more comprehensive integration test environments. Pinecone's official local emulator (2024–2025) is a significant DX improvement over the previous approach of mocking the Pinecone SDK.

_Legacy Technology:_ LocalStack as a full AWS emulator is valuable for teams requiring complete offline dev, but adds significant operational complexity. For teams with reliable internet, a real AWS dev account (sandbox) + DynamoDB Local is the simpler pattern.

_Community Trends:_ The `-sharedDb` DynamoDB Local flag and `dynamodb-admin` GUI are near-universal recommendations in community resources for Docker Compose setups. `@aws-sdk/client-dynamodb` v3 with `DynamoDBDocumentClient` is the standard abstraction layer.

_Source:_ [DynamoDB Local Setup Guide](https://dynobase.dev/run-dynamodb-locally/), [LocalStack S3 Mocking Tools Analysis](https://blog.localstack.cloud/2024-04-08-exploring-s3-mocking-tools-a-comparative-analysis-of-s3mock-minio-and-localstack/)
