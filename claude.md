# 📚 Claude Development Guide - Worktree

**Last Updated**: 2026-03-05 (AWS Stack Migration)
**For**: Development Team
**Quick Access**: Bookmark this file!

---

## ⚡ Deployment & Workflow

### Development Cycle

1. **Review Codebase** — Read `README.md` and project structure.

   > [!IMPORTANT]
   > **NO LOCALHOST RULE**: Never use `localhost` or `127.0.0.1` in the codebase for binding or accessing services — this breaks Docker networking. Always bind to `0.0.0.0` and use Docker service names (e.g., `dynamodb-local`, `redis`) or environment variables.

2. **Make Changes** — Implement features or fixes.

3. **Pre-Deployment Checks**

```bash
   npm run test
   npm run build
   npm run lint
```

4. **Deploy** — Push to GitHub; GitHub Actions → ECR → ECS rolling deploy.

```bash
   git push origin main
```

### Access & Testing

- **Live Site**: [https://worktree.pro](https://worktree.pro)
- **API Documentation**: [https://worktree.pro/api/docs](https://worktree.pro/api/docs)
- **Architecture**: [architecture.md](./_bmad-output/planning-artifacts/architecture.md)

---

## 🐳 Local Development Setup

### Prerequisites

- Docker Desktop installed and running
- `.env.local` configured (copy from `.env.example`, fill in AWS credentials)

> [!IMPORTANT]
> DynamoDB runs **locally** in Docker. S3 connects to a real AWS dev bucket. Pinecone connects to the real free-tier API or the optional `pinecone-local` container.

### Quick Start

```bash
# 1. Configure local environment
cp .env.example .env.local
# Edit .env.local with AWS credentials (ask team for S3 + Pinecone keys)

# 2. Start all local services
docker compose up --watch

# 3. In a second terminal: create DynamoDB tables + seed dev data (idempotent)
bash scripts/seed-dev.sh

# 4. Access the application
# Frontend:          http://localhost:3005
# DynamoDB Admin UI: http://localhost:8101  (table inspector)
# Health Check:      http://localhost:3005/api/health

# Dev login credentials:
#   Admin:  admin@worktree.pro  / password
#   User:   user@worktree.com   / password
```

### Local Service Map

| Service | Docker Image | Port | Notes |
| --- | --- | --- | --- |
| `app` | Project Dockerfile | `3005` | Next.js + Express API |
| `ws-server` | Project Dockerfile | `1234` | Hocuspocus WebSocket |
| `worker` | Project Dockerfile | — | BullMQ background jobs |
| `dynamodb-local` | `amazon/dynamodb-local` | `8100` | Full DynamoDB API emulation |
| `dynamodb-admin` | `aaronshaf/dynamodb-admin` | `8101` | Browser table inspector (DX only) |
| `redis` | `redis:7` | `6380` | ElastiCache equivalent |
| `localstack` | `localstack/localstack` | `4510` | AWS S3 local emulation |
| `pinecone-local` *(optional)* | `pinecone-io/pinecone-local` | `5080` | In-memory Pinecone emulator |

### Required Environment Variables (`.env.local`)

```bash
NODE_ENV=development

# DynamoDB Local (Docker service name — do NOT use localhost)
DYNAMODB_ENDPOINT=http://dynamodb-local:8100
DYNAMODB_REGION=us-east-1
DYNAMODB_TABLE_NAME=worktree-local

# Redis (Docker service name)
REDIS_URL=redis://redis:6380

# S3 — LocalStack (fully local, no real AWS credentials needed)
S3_ENDPOINT=http://localstack:4510
S3_BUCKET=worktree-local
# Note: LocalStack accepts any non-empty fake credentials
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
AWS_REGION=us-east-1

# Pinecone — option A: real free-tier API
PINECONE_API_KEY=[get-from-team]
# Pinecone — option B: local container
# PINECONE_API_KEY=local
# PINECONE_HOST=http://pinecone-local:5080

# Auth.js (NextAuth v5)
AUTH_SECRET=[32+-character-secret]
NEXTAUTH_URL=http://localhost:3005
```

> [!WARNING]
> Never commit `.env.local` to git. It contains sensitive credentials and is already in `.gitignore`.

### Stopping & Resetting

```bash
# Stop all services
docker compose down

# Clean slate — wipes DynamoDB SQLite data (re-run seed-dev.sh after)
docker compose down -v
docker compose up --watch
bash scripts/seed-dev.sh
```

### DynamoDB Operations

```bash
# Re-seed without wiping (idempotent — safe to re-run any time)
bash scripts/seed-dev.sh

# Inspect tables in browser
open http://localhost:8101

# Run a raw DynamoDB query against local
aws dynamodb list-tables --endpoint-url http://localhost:8100 --region us-east-1

# Scan a table directly
aws dynamodb scan --table-name worktree-local --endpoint-url http://localhost:8100 --region us-east-1
```

> [!NOTE]
> There are **no migrations**. DynamoDB is schema-less. Entity changes are code-only — update the ElectroDB entity definition and re-run the seed script if you need to recreate the table.

### Troubleshooting Local Development

**Container won't start:**

```bash
docker compose logs app
# Check if ports are available
netstat -ano | findstr :3005
netstat -ano | findstr :8100
```

**DynamoDB tables missing after restart:**

```bash
# Tables only persist when the dynamodb-data volume exists.
# If you ran `docker compose down -v`, re-create them:
bash scripts/seed-dev.sh
```

**"Tables created by different scripts are not visible" / data isolation issue:**

- Ensure `dynamodb-local` is started with `-sharedDb` flag in `docker-compose.yml`.
- Without `-sharedDb`, each connection sees an isolated SQLite dataset.

**S3 upload fails (LocalStack):**

- Check LocalStack is running: `docker compose ps localstack`
- Verify the bucket was created: `aws s3 ls --endpoint-url http://localhost:4510`
- Re-create the bucket: `bash scripts/seed-dev.sh` (step 1 recreates it)
- Confirm `S3_ENDPOINT=http://localstack:4510` and `forcePathStyle: true` in `lib/s3.ts`

**Module not found after ****`docker compose down -v`****:**

```bash
# Stale node_modules volume — rebuild
docker compose up --watch --build
bash scripts/seed-dev.sh
```

**TypeScript errors:**

```bash
rm -rf .next dist
npm run build
```

---

## 🏗️ Project Structure

```
worktree/
├── apps/
│   ├── frontend/                # Next.js App Router
│   │   ├── app/
│   │   │   ├── (auth)/         # Login / Signup routes
│   │   │   ├── (dashboard)/    # Protected layout
│   │   │   └── api/            # Route handlers
│   │   ├── features/           # <— MODULAR MONOLITH DOMAINS
│   │   │   ├── projects/
│   │   │   ├── forms/
│   │   │   ├── sheets/         # Real-time Smart Grid (Yjs)
│   │   │   ├── routing/
│   │   │   ├── documents/
│   │   │   ├── ai-assistant/
│   │   │   ├── rag/
│   │   │   └── offline/
│   │   ├── components/ui/      # Shadcn/UI
│   │   └── lib/
│   │       ├── dynamodb.ts     # DynamoDB client (endpoint-switched)
│   │       ├── s3.ts           # S3 client
│   │       ├── redis.ts        # Redis client
│   │       └── pinecone.ts     # Pinecone client
│   └── backend/                # Express.js API (REST for mobile)
│       ├── src/
│       │   ├── entities/       # ElectroDB entity definitions
│       │   ├── repositories/   # Data access layer
│       │   ├── routes/
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   └── rbac.ts     # requireProjectAccess()
│       │   └── services/
│       └── tests/
├── scripts/
│   └── seed-dev.sh             # DynamoDB table creation + dev data seed
├── docker-compose.yml
├── .env.example
└── _bmad-output/               # Planning & architecture docs
    └── planning-artifacts/
        ├── architecture.md     # System architecture (source of truth)
        └── project-context.md  # Project constraints & dev environment
```

---

## 💻 Code Standards

### TypeScript

- **Strict Mode**: Always enabled (`"strict": true`, `noImplicitAny: true`)
- **No ****`any`**: Use `unknown` then narrow, or model the type properly
- **Zod schemas**: Required for ALL API inputs (REST endpoints and Server Actions)

### File Naming

- **Components**: PascalCase (`LoginForm.tsx`, `SmartGrid.tsx`)
- **Utilities**: camelCase (`dynamodb.ts`, `formatDate.ts`)
- **Types**: PascalCase (`User.ts`, `FormSchema.ts`)
- **Constants**: UPPER_SNAKE_CASE
- **Folders**: kebab-case

### The Feature Rule

All logic lives in `apps/frontend/features/{domain}`. No loose files in `components/` unless generic UI.

- UI: `features/{domain}/components/`
- Server: `features/{domain}/server/` (Server Actions)
- State: `features/{domain}/store/`

### DynamoDB / ElectroDB Rules

- **Never mock the DynamoDB SDK** — use vitest-dynalite for integration tests.
- **Never write raw DynamoDB ****`PutItem`** in routes — always go through an ElectroDB entity.
- **All queries scoped by ****`projectId`** — enforced in `requireProjectAccess()` before any DB call.
- **No migrations** — ElectroDB entity definitions are the schema contract.

### Next.js Runtime Rules

- **AWS SDK (DynamoDB, S3, Pinecone) = Node.js runtime only.**
- Do NOT add `export const runtime = 'edge'` to any route that uses these clients.
- Default runtime (no export) is Node.js — this is correct.

### Defensive Coding (Anti-Patterns to Avoid)

- **No ****`as any`****, ****`@ts-expect-error`****, or ****`eslint-disable-next-line`**: Enforce strict types and fix root compiler issues.
- **No Hardcoded Hex/Z-Index**: Rely strictly on `globals.css` scales and Tailwind `hsl` vars. NEVER interpolate classes via raw strings (`className={\`...\`}`); securely use `cn(...)`.
- **No Unmanaged Browser Operations**: NEVER utilize `window.localStorage` directly or raw `fetch(...)` arbitrarily. State relies on Context/Zustand wrappers, and data fetches use server actions or centralized bounded clients. NEVER use raw `<a>` tags for internal links; use `<Link>`.
- **No Silent UI Failures**: NEVER `return null;` as a fail-safe against broken props. Map failures to Skeletons or application `<ErrorBoundary>` wrappers.

### Component Library

> [!IMPORTANT]
> Every new UI component must be registered in `apps/frontend/app/(dashboard)/component-library/page.tsx` in the appropriate `ATOMS`, `MOLECULES`, or `ORGANISMS` array with a static preview using hard-coded dummy data.

### Backend (Express)

- **Middleware Chain**: Auth → RBAC → Validation → Handler → Error
- **Response Format**: `{ success: boolean, data?, error?, message? }`
- **Status Codes**: 200, 201, 400, 401, 403, 404, 500

---

## 🧪 Testing Standards

### Coverage Requirements

- **Minimum**: ≥90% code coverage
- **Measurement**: `npm run test:coverage`

### Test Types

**Integration Tests — vitest-dynalite (DynamoDB)**

```typescript
// Never mock the SDK. Run real queries against Dynalite.
import { describe, it, expect } from "vitest";
import { UserEntity } from "../entities/user";

describe("UserEntity", () => {
  it("creates and retrieves a user", async () => {
    const user = await UserEntity.create({
      email: "test@test.com",
      name: "Test",
    }).go();
    const found = await UserEntity.get({
      pk: user.data.pk,
      sk: user.data.sk,
    }).go();
    expect(found.data.email).toBe("test@test.com");
  });
});
```

**E2E Tests** (Playwright)

```typescript
test("user can login and see dashboard", async ({ page }) => {
  await page.goto("http://localhost:3005/login");
  await page.fill('input[name="email"]', "admin@worktree.pro");
  await page.fill('input[name="password"]', "password");
  await page.click('button:has-text("Sign in")');
  await expect(page).toHaveURL("/dashboard");
});
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] All secrets in environment variables (no hardcoded values)
- [ ] `AUTH_SECRET` is 32+ characters
- [ ] HTTPS enforced in production (ALB handles TLS termination)
- [ ] CORS configured for allowed domains only
- [ ] Rate limiting enabled on auth endpoints
- [ ] Input validation on all endpoints (Zod)
- [ ] All DynamoDB calls scoped by `projectId` via `requireProjectAccess()`
- [ ] Password hashing uses bcrypt 10+ rounds
- [ ] Audit logs written for all mutations
- [ ] `npm audit` clean

---

## 🐛 Troubleshooting

### Docker Issues

```bash
# Check all container logs
docker compose logs -f

# Full clean restart
docker compose down -v
docker compose up --watch --build
bash scripts/seed-dev.sh
```

### Port conflicts

```bash
netstat -ano | findstr :3005   # app
netstat -ano | findstr :8100   # dynamodb-local
netstat -ano | findstr :6380   # redis
```

### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Clear and reinstall
rm -rf node_modules
npm install
```

---

## 📋 Commit Conventions

```
feat: add user login functionality
fix: resolve JWT token expiration bug
docs: update architecture with local dev setup
test: add ElectroDB entity integration tests
refactor: extract DynamoDB client factory
chore: update AWS SDK dependencies
```

---

## 🚀 Production Deployment (AWS ECS Fargate)

### How it works

GitHub Actions → ECR (container registry) → ECS rolling deploy on push to `main`.
No manual steps required after `git push origin main`.

### Production URLs

- **Live Site**: https://worktree.pro
- **API**: https://worktree.pro/api
- **Health Check**: `curl ``https://worktree.pro/api/health`

### ECS Services

| Service | Description |
| --- | --- |
| `app` | Next.js frontend + Express REST API |
| `ws-server` | Hocuspocus WebSocket (real-time Smart Grid) |
| `worker` | BullMQ background job processor |

### Production Environment Variables (set in ECS Task Definition / GitHub Secrets)

```bash
NODE_ENV=production
NEXTAUTH_URL=https://worktree.pro
AUTH_SECRET=[32+-character-secret]

# DynamoDB — no endpoint override, SDK uses real AWS
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=worktree-prod

# S3
S3_BUCKET=worktree-prod

# ElastiCache
REDIS_URL=rediss://[elasticache-cluster-endpoint]:6379

# Pinecone
PINECONE_API_KEY=[real-key]
# No PINECONE_HOST override — uses real Pinecone endpoint
```

> [!CRITICAL]
> Do NOT set `DYNAMODB_ENDPOINT` in production. The absence of this variable is what tells the SDK to use real AWS DynamoDB. Setting it to `http://dynamodb-local:8100` in production would route all DB calls to a non-existent container.

### Post-Deployment Verification

```bash
curl https://worktree.pro/api/health
# Expected: {"status":"ok","dynamodb":"connected","redis":"connected"}
```

---

## 📞 Support & Architecture Docs

- 🏗️ **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- 📋 **Project Context**: `_bmad-output/planning-artifacts/project-context.md`
- 📖 **Epics & Stories**: `_bmad-output/planning-artifacts/epics.md`
- 📊 **Sprint Status**: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## 📸 S3 File Handling

**Pattern is unchanged from MinIO — only the SDK changed. Local dev uses LocalStack.**

1. **Uploads**: Client requests presigned URL from backend → uploads directly to S3/LocalStack (no backend streaming).
2. **Serving**: Backend generates presigned URL → redirects (302) to it. Images are NOT served from public URLs.
3. **Tracking**: All files tracked in `FileUpload` DynamoDB entity with `objectKey`, `projectId`, `submissionId`.

```typescript
// lib/s3.ts
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT, // 'http://localstack:4510' in local dev
    forcePathStyle: true, // Required for LocalStack
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  }),
});
// S3_ENDPOINT not set in production → SDK uses real AWS S3 with IAM credentials
```
