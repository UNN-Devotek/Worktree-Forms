---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
inputDocuments:
  - c:\Users\White\Documents\Worktree\Worktree\_bmad-output\planning-artifacts\prd.md
workflowType: "architecture"
project_name: "Worktree"
user_name: "White"
date: "2026-01-08"
---

# Architecture Decision Document

> [!NOTE]
> Part of the **[Worktree Project Plan](./project-context.md)**.
> **Role:** Defines **HOW** we function technically.
> **Source:** `architecture.md`

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

- **Core Domain**: Project-Centric Operations (Forms, Routes, Files, Chat) managed as unified "Aggregates".
- **Field Tech Experience**: Offline-first Mobile App with "Append-Only Ledger" sync and "Contextual Compass" (Geofence) auto-launch.
- **Data Ingestion**: "Magic Forward" (IMAP IDLE) for zero-touch project creation and "Bulk Paste Grid" for rapid data entry.
- **Intelligence**: RAG Engine (Pinecone vector search) for context-aware queries and active Blueprint annotation.
- **Security**: Strict RBAC with "Project Visa" (Gated Access) for subcontractors.

**Non-Functional Requirements:**

- **Deployment**: AWS managed services (ECS Fargate + DynamoDB + S3 + ElastiCache + Pinecone).
- **Performance**: <100ms API latency, <5% battery drain for geofencing, sub-2s offline startup.
- **Reliability**: Sync resilience for long-running uploads; DynamoDB point-in-time recovery enabled.
- **Data Isolation**: Application-layer tenant isolation — all queries scoped by `projectId` partition key prefix; enforced in RBAC middleware before any DynamoDB call.

**Scale & Complexity:**

- **Primary Domain**: Full-Stack (Web + Mobile + Backend + AI).
- **Complexity Level**: **High**. Combining Offline Sync, Geofencing, Real-time Sockets, and RAG in a multi-service AWS architecture is architecturally demanding.
- **Estimated Components**: ~15 (Auth, Projects, Forms, Submissions, Routes, Chat, Files, AI, Email, Geofence, Notifications, Analytics, etc.).

### Technical Constraints & Dependencies

- ~~**Strict Self-Hosting**: Must run on standard Linux VPS without proprietary cloud services.~~ _Constraint removed 2026-03-05 — strategic pivot to full AWS managed services stack._
- **Mobile Native Bridge**: Capacitor required for "Background-to-Foreground" handoff.
- ~~**System Density**: Full stack must fit in <4GB RAM.~~ _Removed — ECS Fargate right-sizes each service independently; no single-server constraint._
- **Schema Evolution**: Backend must support multiple schema versions for offline clients.

### Cross-Cutting Concerns Identified

- **Synchronization Engine**: The "Append-Only Ledger" pattern for all write operations.
- **Multi-Tenancy (Application-Layer)**: All DynamoDB queries scoped by `PROJECT#<projectId>` partition key prefix; enforced in RBAC middleware before any DB call.
- **Real-Time Event Bus**: ElastiCache Redis pub-sub for Chat/Notifications/Jobs and Hocuspocus multi-instance coordination.

## Technology Foundation

> _Note: The project was originally bootstrapped from Create T3 App (Next.js + Prisma + Postgres). The database layer has since been migrated to DynamoDB + ElectroDB as part of the 2026-03-05 AWS stack pivot. The frontend, API patterns, and component architecture remain as originally designed._

### Core Technology Decisions

| Concern | Decision | Rationale |
|---|---|---|
| **Language** | TypeScript (strict mode) | Type safety across full stack — mandatory for DynamoDB access patterns |
| **Frontend** | Next.js App Router | Nested layouts, RSC, Server Actions for web dashboard |
| **Component Library** | shadcn/ui | Copy-paste, no npm abstraction to fight; accessible primitives |
| **Styling** | Tailwind CSS | Utility-first, standard for modern React |
| **Database** | AWS DynamoDB + ElectroDB | Single-table design, TypeScript-first ODM, no schema migrations |
| **Auth** | Auth.js (NextAuth v5) + `@auth/dynamodb-adapter` | Database sessions in DynamoDB, instant server-side revocation |
| **API Pattern** | Hybrid — Server Actions (web) + REST (mobile) | Server Actions co-locate web mutations; REST provides versioned contract for mobile sync |
| **Testing** | Vitest + vitest-dynalite + Playwright | Integration tests against DynamoDB Local; E2E via Playwright |
| **Monorepo** | npm workspaces (`apps/frontend`, `apps/backend`) | Shared types and tooling across web and Express API |

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
worktree/
├── docker-compose.yml       # Self-Hosting Orchestration
├── apps/
│   ├── frontend/            # Next.js App Router Application
│   │   ├── next.config.mjs
│   │   ├── package.json
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── (auth)/          # Login/Signup Routes
│   │   │   ├── (dashboard)/     # Protected Layout
│   │   │   └── api/             # API Routes
│   │   ├── components/
│   │   │   └── ui/              # Shadcn/UI
│   │   ├── features/            # <--- MODULAR MONOLITH DOMAINS
│   │   │   ├── projects/        # Core PM Logic
│   │   │   ├── forms/           # Form Builder
│   │   │   ├── sheets/          # Real-Time Smart Sheets (Yjs)
│   │   │   ├── calendar/        # [NEW] Project Calendar (Launch UI)
│   │   │   ├── routing/         # Route Planner
│   │   │   ├── documents/       # PDF Engine
│   │   │   ├── users/           # User Profile
│   │   │   ├── notifications/   # Notifications
│   │   │   ├── ai-assistant/    # [NEW] Global AI Agent (Launch UI + Vercel SDK)
│   │   │   ├── rag/             # Vector Store
│   │   │   ├── templates/       # Project Types
│   │   │   ├── rfis/            # [NEW] RFI Management
│   │   │   ├── specs/           # [NEW] Specification Library
│   │   │   ├── scheduling/      # [NEW] Gantt & Schedule
│   │   │   └── offline/         # Sync Engine
│   │   ├── lib/                 # Shared Utils
│   │   └── server/              # Server Actions
│   └── backend/             # (Optional) Separate Node Services (Socket.io/Worker)
```

### Architectural Boundaries

**The Feature Rule:**
Logic must live in `src/features/{domain}`.

- **UI**: `src/features/{domain}/components/`
- **Server**: `src/features/{domain}/server/` (Actions)
- **State**: `src/features/{domain}/store/`

**Inter-Feature Communication:**
Features should interact via **Public API** (exported functions) or **Events** (Redis Pub/Sub), never by deep imports.

**Requirements Mapping:**

- **Blueprints (Journey 4)** -> `src/features/documents/` (PDF Viewer).
- **AI RAG (Innovation 2)** -> `src/features/rag/` (Vector Store).
- **Smart Tables (Journey 6)** -> `src/features/sheets/`.
- **Project DNA (Innovation 5)** -> `src/features/templates/`.
- **User Profiles (FR10)** -> `src/features/users/`.
- **Notifications (FR7)** -> `src/features/notifications/`.
- **Help Center (FR19)** -> `src/features/help-center/`.

### Development Workflow

1.  **Infrastructure**: `docker compose up --watch` (DynamoDB Local, Redis — matches ElastiCache protocol exactly)
2.  **App**: Next.js + Express hot-reload via Compose Watch
3.  **No migrations**: DynamoDB is schema-less — entity changes are code-only, no `prisma migrate dev`
4.  **S3 + Pinecone**: Connect to real AWS dev-environment resources (no local equivalent needed)

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- **ODM Selection**: ElectroDB (TypeScript-first DynamoDB ODM, single-table design, full type inference). Replaces Prisma.
- **API Pattern**: Hybrid (Server Actions for Web, REST for Mobile).
- **UI Library**: **shadcn/ui** (User Mandate).

### Data Architecture

- **Database**: **AWS DynamoDB** (single-table design).
- **ODM**: **ElectroDB** (Latest). Chosen for TypeScript-first DynamoDB modeling, single-table design support, and type-safe query API. Replaces Prisma.
- **Multi-Tenancy**: **Application-Layer Tenant Isolation**.
  - _Pattern_: All DynamoDB items use composite keys with `PROJECT#<projectId>` as the partition key prefix. Every query is scoped at the service layer.
  - _Enforcement_: A shared `requireProjectAccess(userId, projectId, requiredRole)` middleware validates membership before any DynamoDB operation. Unauthorized calls return 403 before hitting the DB.
  - _No migration files_: DynamoDB is schema-less. Entity definitions in ElectroDB serve as the schema contract. Breaking changes are handled via attribute versioning.

### Data Architecture — Entity Reference

> [!NOTE]
> **This section is a placeholder.** The full DynamoDB single-table entity definitions, key schema, and GSI map are produced as the output of **Story 0.1** (DynamoDB Table Design & ElectroDB Entity Definitions). Update this section when Story 0.1 is complete.

**Key Design Rules (established — see Story 0.1 for full schema):**

- All items use `PK` / `SK` composite keys. Partition key prefix encodes entity type and tenant scope.
- Pattern: `PK: PROJECT#<projectId>` + `SK: <ENTITY_TYPE>#<entityId>` for all project-scoped entities.
- Global Secondary Indexes (GSIs) support alternate access patterns (e.g., lookup by email, by entity ID without knowing project).
- Auth records (`@auth/dynamodb-adapter`) share the same table using `pk`/`sk` keys in the auth namespace.

**Entity Domains (to be fully defined in Story 0.1):**

| Domain | Entities |
|---|---|
| Identity | User, ProjectMember |
| Projects | Project, ProjectTemplate |
| Forms | Form, FormVersion, Submission |
| Sheets | Sheet, SheetColumn, SheetRow |
| Field Ops | Route, RouteStop |
| Tasks | Task, EntityLink |
| Documents | SpecSection |
| Compliance | ComplianceRequirement, ComplianceRecord |
| Files | FileUpload |
| AI | VectorEmbedding, AiConversation |
| Access | PublicToken, AuditLog |
| Help | HelpArticle, HelpCategory |

**RBAC System (DynamoDB):**

- **Site Roles** (`OWNER`, `SITE_ADMIN`, `CREATOR`, `MEMBER`): stored as an attribute on the `User` entity.
- **Project Roles** (dynamic, snapshot): stored as a JSON attribute on the `Project` entity — `roles: { "Foreman": ["SHEET_VIEW", "FORM_SUBMIT"] }`. Created by copying Template role definitions at project creation time; future template changes do not cascade.
- **Self-Demotion Guard**: Enforced at the application layer in `requireProjectAccess()` — prevents removing the last `DIRECTOR` from a project before committing the write.
- **Permission Caching**: Permissions are embedded in the Auth session. Role changes trigger `auth:force_refresh` via Socket.io event; client re-validates immediately.

### Smart Grid System (Hocuspocus + DynamoDB)

- **Infrastructure**: **Hocuspocus** WebSocket server — dedicated `ws-server` ECS service.
- **Persistence Strategy**:
  - **Live**: In-memory Yjs CRDT binary (Hocuspocus in-memory state per document).
  - **Durable**: Hocuspocus **Database Extension** saves Yjs document snapshots to DynamoDB (`Sheet` entity) every 5 minutes or on session end. Uses DynamoDB conditional writes on a `version` attribute to detect conflicts.
  - **Querying**: `SheetRow` DynamoDB entities mirror the Yjs data for API-based reporting (Dashboard metrics). ElectroDB collection query retrieves all rows for a sheet in a single request.
  - **Multi-Instance Sync**: Hocuspocus **Redis Extension** on ElastiCache pub-sub propagates Yjs CRDT updates across all `ws-server` ECS tasks. ALB stickies each WebSocket connection to one task.
- **Concurrency**: Last-Write-Wins on Yjs cell edits (CRDT handles conflict-free merge). DynamoDB condition expression on `version` attribute prevents concurrent snapshot overwrites.

**Connected Systems (Integration Layer):**

- **Form-to-Sheet**:
  - `SheetColumn.sourceFieldId`: Maps a column to a specific Form Field ID.
  - `SheetRow.submissionId`: Links a row to its source submission (Source of Truth).
- **Sheet-to-Route**:
  - `Route.sourceSheetId`: Defines the sheet driving this route.
  - `RouteStop.sheetRowId`: Bi-directional link — updating the stop updates the row.
  - `SheetRow.routeGroupId`: Groups rows belonging to a route for map visualization.

**Task System (formerly RFI):**

- `Task`: Core work item (`status`, `title`, `dueDate`, `assigneeId`, `type`).
- `SpecSection`: Parsed text from PDF spec books (`code`, `title`). Pinecone vector ID stored in `VectorEmbedding` entity.
- `ScheduleTask`: Gantt activity (`startDate`, `endDate`, `dependencies[]`).
- **`EntityLink` (Polymorphic DynamoDB pattern)**: Links tasks, specs, sheet regions. Enforced at the application layer (no DB-level CHECK constraint in DynamoDB).

### Granular Visibility & Permissions (Deep Dive)

**Requirement:** Project Admins must set visibility on _all_ folders, objects, and chats.

**DynamoDB Attribute Strategy:**

- **Entity Mixin:** `Form`, `Sheet`, `Folder`, `ChatChannel` ElectroDB entities all include a `visibilityConfig` map attribute.
- **Structure**:
  ```typescript
  visibilityConfig: {
    mode: 'PUBLIC' | 'PRIVATE' | 'ROLE_RESTRICTED',
    allowedRoles: string[],   // e.g. ["manager", "admin"]
    allowedUsers: string[]    // user IDs granted explicit access
  }
  ```

**Application-Layer Enforcement (replaces PostgreSQL RLS):**

- **Middleware**: `requireProjectAccess()` reads `visibilityConfig` from the fetched entity and evaluates against the caller's `projectRole` before returning data.
- **Deep Links**: Direct URL access to a Private ID returns `403 Forbidden` — enforced in the API route handler, not at the database layer.
- **Concurrency**: DynamoDB conditional writes using `version` attribute prevent race conditions on visibility changes. If User A revokes User B's access while User B writes, the middleware check on B's next request will reject the operation.
- **Export Process**: The "Export to Zip" BullMQ worker evaluates `visibilityConfig` for each file before including it in the ZIP — no RLS impersonation required.

**Real-Time Security:**

- **Instant Revocation**: Role changes (e.g., Demotion) trigger a Socket.io event (`auth:force_refresh`) via ElastiCache pub-sub.
- **Client Action**: The client listens for `auth:force_refresh` and immediately re-validates the session or redirects to Login if access is lost.

### API & Communication Patterns

- **Versioning Strategy (Universal History)**:
  - **Pattern**: **Mutation-Based Audit Log**.
  - **Implementation**:
    - **Forms**: Store JSON Schema versions as `FormVersion` DynamoDB entities under the same `PROJECT#<id>` partition.
    - **Sheets**: Yjs CRDT (Hocuspocus) is the source of truth for live collaboration. Hocuspocus Database Extension periodically snapshots the Yjs binary to a `SheetVersion` DynamoDB entity for rollback.
    - **Audit Trail**: An `AuditLog` DynamoDB entity records all mutations with `userId`, `action`, `entityType`, `entityId`, and `timestamp`. Written as part of the service layer, not via DB triggers.

### Authentication & Security

- **Provider**: **Auth.js (NextAuth v5)**.
- **Strategy**: **Database Sessions**.
  - _Rationale_: JWTs cannot be easily revoked. For "Quarantine Safety" (NFR5), we need instant server-side revocation capabilities.
- **Permissions**: **Middleware Enforcement**. Next.js Middleware will check `compliance_status` before allowing navigation to protected routes.

### API & Communication Patterns

- **Web Dashboard**: **React Server Actions**.
  - _Rationale_: Simplifies data mutation for the dashboard, keeping logic co-located with UI components.
- **Mobile App**: **REST API** (`app/api/v1/mobile/...`).
  - _Rationale_: Provides a strict, versioned contract for the Offline Sync engine and Capacitor layer. Decouples the mobile release cycle from the frontend.

### New Technical Capabilities (Phase 2 Update)

**Real-Time Collaboration Engine (Smart Grid):**

- **Libraries**:
  - **State**: **Yjs** (CRDT) for conflict-free sync.
  - **Rendering**: Custom CSS-Grid renderer (primary) with **TanStack Table v8** + **TanStack Virtual** available as an alternate `LiveTable` view mode.
  - **Math**: **Hyperformula** (Headless Formula Engine).
- **Architecture**:
  - **Frontend**: Custom `SmartGrid` component. Connects to WebSocket via `y-websocket` (or Hocuspocus client provider).
  - **Backend**: **Hocuspocus** WebSocket server (`ws-server` ECS service) with **DynamoDB persistence** (Database Extension) and **ElastiCache pub-sub** (Redis Extension for multi-instance sync).
  - **Persistence**: Hybrid model.
    - Active State: In-memory Yjs document on the Hocuspocus instance handling that connection.
    - Durability: Hocuspocus Database Extension snapshots to `SheetVersion` DynamoDB entity every 5 minutes or on session end.
    - Query Layer: `SheetRow` DynamoDB entities mirror row data for REST API access (dashboard metrics, mobile read).
- **Row-Centricity**:
  - Data is structured as `Row[]` with stable UUIDs, not `Cell[][]`.
  - This allows "Row Attachments" and "Row Chat" to link reliably even if the row is moved or sorted.

**Global AI Assistant (Agentic):**

- **Framework**: **Vercel AI SDK** (`ai` package) + **Google Gemini / OpenAI / Anthropic Models**.
- **Backend Architecture**:
  - **Route**: `app/api/chat/route.ts` (Edge/Node.js Runtime).
  - **Tool Layer**: `ai-tools.ts` defines the registry of callable functions.
- **Security & Permissions (CRITICAL)**:
  - **Pattern**: **"Server Action Proxy"**. The AI strictly calls _Tools_, which strictly call _Server Actions_.
  - **Enforcement**:
    - Every Server Action (`actions/*.ts`) validates `await auth()` and `checkPermission()`.
    - The AI _cannot_ bypass this because it has no direct database access.
    - If a Tool call fails (403 Forbidden), the AI receives the error and explicitly informs the user: "I cannot do that because you lack permissions."
- **System Prompt Strategy**:
  - **Dynamic Context Injection**: The System Prompt is constructed at runtime including:
    1.  **User Context**: Name, Role, ID.
    2.  **Page Context**: JSON summary of the active screen (e.g., "Viewing Sheet ID 123, Rows 1-50").
    3.  **Guardrails**: "You are a helpful assistant. You do not have direct DB access. You must use Tools for all modifications."
  - **Format**: Structured instructions to prefer specific Tools over general knowledge.

**PDF Engine:**

- **Library**: **pdf-lib** (Node.js/Browser).
- **Use Case**:
  - **Overlay**: Cartesian coordinate mapping of Form Fields -> PDF Locations.
  - **Flattening**: "Burning" text onto the PDF base layer upon export.

### Frontend Architecture

- **Framework**: Next.js 14 App Router.
- **Component Library**: **shadcn/ui**.
  - _Rationale_: "Copy-paste" architecture allows full customization without fighting an npm package abstraction. High quality, accessible primitives.
- **Styling**: Tailwind CSS (Standard).

### Infrastructure & Deployment

- **Deployment**: **AWS ECS Fargate** (serverless containers — no EC2 provisioning).
- **Image Registry**: **AWS ECR** (Elastic Container Registry).
- **Load Balancing**: **AWS ALB** (Application Load Balancer) — HTTP/HTTPS for app, WebSocket routing for Hocuspocus WS server. ALB stickies WebSocket connections automatically.
- **DNS**: **AWS Route 53** for domain management.
- **CI/CD**: GitHub Actions with **OIDC** (no static AWS credentials) → build → push to ECR → ECS rolling deploy on push to `main`. `wait-for-service-stability: true` surfaces broken deploys in CI.
- **IaC**: **AWS CDK TypeScript** — `ApplicationLoadBalancedFargateService` L2 construct for ECS + ALB. CDK L2 constructs available for DynamoDB, ElastiCache, and S3.
- **Container Strategy**: Three ECS services — `app` (Next.js + Express), `ws-server` (Hocuspocus), `worker` (BullMQ). No persistence containers in ECS — all persistence is AWS managed services.
- **Inter-Service Communication**: **ECS Service Connect** for internal service-to-service traffic (short DNS names, built-in retries).
- **VPC Endpoints**: DynamoDB and S3 VPC Gateway Endpoints (free) — keeps AWS API traffic off the public internet, reduces NAT Gateway costs.
- **Local Development**: Docker Compose with `amazon/dynamodb-local` + `redis:7` + optional `pinecone-local`. S3 uses a real AWS dev bucket. See the Local Development section below for full service map and configuration.

### Local Development Environment

_Research source: technical-Local-Dev-AWS-Stack-Worktree-research-2026-03-05.md_

#### Docker Compose Service Map

| Service | Docker Image | Local Port | Production Equivalent |
|---|---|---|---|
| `app` | Project Dockerfile | `3005` | ECS `app` service |
| `ws-server` | Project Dockerfile | `1234` | ECS `ws-server` service |
| `worker` | Project Dockerfile | — | ECS `worker` service |
| `dynamodb-local` | `amazon/dynamodb-local` | `8000` | AWS DynamoDB |
| `dynamodb-admin` | `aaronshaf/dynamodb-admin` | `8001` | DX tool only — not in production |
| `redis` | `redis:7` | `6379` | AWS ElastiCache for Redis 7.1 |
| `pinecone-local` _(optional)_ | `pinecone-io/pinecone-local` | `5080` | Pinecone (in-memory, 100K record limit) |

#### Critical Configuration Rules

**DynamoDB Local — `-sharedDb` flag is mandatory.**
Without it, each Node.js process (including Next.js hot-reload forks) opens a connection that sees a different isolated SQLite dataset. Tables created by the seed script become invisible to the app. Always pass `-sharedDb` in the Docker Compose command.

```yaml
# docker-compose.yml
dynamodb-local:
  image: amazon/dynamodb-local
  command: "-jar DynamoDBLocal.jar -sharedDb -dbPath /data"
  volumes:
    - dynamodb-data:/data
  ports:
    - "8000:8000"
```

**Redis — `noeviction` policy is mandatory for BullMQ.**
BullMQ requires Redis to never silently drop queue entries. Match production ElastiCache config:

```yaml
redis:
  image: redis:7
  command: "redis-server --maxmemory-policy noeviction"
  ports:
    - "6379:6379"
```

**Next.js API routes — Node.js runtime only.**
Any Route Handler or Server Component using `@aws-sdk/client-dynamodb`, `@aws-sdk/client-s3`, or `@pinecone-database/pinecone` must run on the Node.js runtime. The AWS SDK v3 is incompatible with the Edge runtime. Do NOT add `export const runtime = 'edge'` to any route that touches these services.

#### Environment Variable Switching

The SDK client factory reads a single env var to select local vs. cloud:

```typescript
// lib/dynamodb.ts
const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT, // 'http://dynamodb-local:8000' locally
  }),
});
```

Local `.env.local` (gitignored):
```bash
DYNAMODB_ENDPOINT=http://dynamodb-local:8000
DYNAMODB_TABLE_NAME=worktree-local
REDIS_URL=redis://redis:6379
# Pinecone — option A: local container
PINECONE_API_KEY=local
PINECONE_HOST=http://pinecone-local:5080
# Pinecone — option B: real free-tier key (remove PINECONE_HOST override)
```

Production `.env` (injected by ECS Task Definition / GitHub Actions secrets):
```bash
# No DYNAMODB_ENDPOINT set → SDK uses real DynamoDB endpoint
DYNAMODB_TABLE_NAME=worktree-prod
REDIS_URL=rediss://<elasticache-cluster-endpoint>:6379
PINECONE_API_KEY=<real-key>
# No PINECONE_HOST override → SDK uses real Pinecone endpoint
```

#### S3 — Real AWS Dev Bucket (no local emulation)

Offline S3 is not a stated requirement for local development. Using a real `worktree-dev` S3 bucket in a sandbox AWS account is the recommended approach:
- Simpler — no LocalStack overhead
- Zero emulation gap — presigned URL behavior is identical to production
- Cost is negligible for dev-scale data volumes

LocalStack S3 remains an option if offline dev becomes a requirement. The SDK `endpoint` override pattern is identical to DynamoDB Local.

#### Pinecone — Two Valid Options

| Option | How | Tradeoff |
|---|---|---|
| `pinecone-local` Docker | `PINECONE_HOST=http://pinecone-local:5080` | Offline; ephemeral (no persistence after `down`) |
| Real Pinecone free tier | Remove `PINECONE_HOST` override; use real API key | Persistent; simplest; requires internet |

**Recommendation:** Start with real Pinecone free tier (simpler). Switch to `pinecone-local` if offline development becomes a requirement.

#### Seed Data Script (`seed-dev.sh`)

Replaces the old Prisma-based `seed-dev.sh`. The new script must:

1. **Create the DynamoDB table** with correct `KeySchema`, `AttributeDefinitions`, and all GSIs — skip creation if table already exists (`ResourceInUseException` caught)
2. **Seed dev users** — `admin@worktree.pro` (OWNER role) and `user@worktree.com` (MEMBER role) with bcrypt-hashed passwords
3. **Seed a sample project** with Forms, Sheets (with columns), and Routes sufficient for UI development
4. **Auth adapter records** — seed NextAuth session table entries for quick login in dev
5. **Idempotent** — using DynamoDB `PutItem` with `ConditionExpression: "attribute_not_exists(PK)"` so re-runs don't duplicate data

Script is run with `tsx scripts/seed-dev.ts` (no build step required).

#### Testing — vitest-dynalite

Integration tests run against **vitest-dynalite** (not mocked SDK):

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import dynalite from 'vitest-dynalite'

export default defineConfig({
  test: {
    setupFiles: ['vitest-dynalite/setup'],
    globals: true,
  },
})

// vitest-dynalite.config.ts
export default {
  tables: [
    {
      TableName: 'worktree-test',
      KeySchema: [{ AttributeName: 'PK', KeyType: 'HASH' }, { AttributeName: 'SK', KeyType: 'RANGE' }],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
  ],
}
```

Rule: **Never mock the DynamoDB SDK**. Always run real queries against Dynalite. This catches access pattern bugs that mocks hide.

### New Infrastructure Decisions (Phase 3 Enterprise)

**Communication Infrastructure:**

- **Email**: Abstraction Layer (`MailService`). Supports **AWS SES** and **SendGrid** API (High Deliverability) over basic SMTP.
- **Webhooks**: **BullMQ** (Redis-backed) Worker Queue for reliable, exponential-backoff retries of outgoing webhook events.

**Background Workers (BullMQ):**

- **PDF Parsing**: Offloaded worker for splitting Spec Books (500MB+) into `SpecSection` rows.
- **OCR**: Tesseract.js (Node worker) for scanned documents.

**Developer Experience & API:**

- **Documentation**: **Swagger / OpenAPI 3.0** auto-generated from Zod Schemas (`zod-to-openapi`). Ensures AI Agent always has the correct Tool definitions.
- **Localization (i18n)**: Backend-Driven. API inspects `Accept-Language` header and returns localized error messages (English/Spanish).

**Redis / ElastiCache Strategy:**

- **Provider**: **AWS ElastiCache for Redis** — fully managed, zero code changes from self-hosted Redis (same protocol, same client libraries).
- **Pub-Sub**: Hocuspocus WebSocket coordination for Yjs Collaboration State (Smart Sheets).
- **Rate Limiting**: Distributed counter store for `rate-limiter-flexible` middleware (global limits across ECS tasks).
- **Job Queues**: BullMQ backing for Webhooks, background jobs, and email ingestion — connects to ElastiCache via `REDIS_URL`.

**Object Storage Strategy:**

- **Provider**: **AWS S3** — replaces self-hosted MinIO. SDK swap only (`minio` → `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`).
- **Presigned URLs**: Pattern unchanged — backend generates presigned URLs, browser uploads/downloads directly to S3.
- **Bucket Structure**: Single bucket `worktree-{env}` with prefix-based organization (same as MinIO).

**Vector Search Strategy:**

- **Provider**: **Pinecone** — replaces pgvector PostgreSQL extension. _Amazon OpenSearch Serverless was originally planned but carries a $350/month minimum cost floor, which is not justified at Worktree's current scale (research finding: 2026-03-05). Pinecone starts at $0 and scales with actual usage._
- **Index Design**: Pinecone index with `projectId` and `submissionId` as metadata fields for filtered retrieval.
- **Query Pattern**: k-NN semantic search for AI assistant RAG queries. Migrate to OpenSearch Provisioned if hybrid keyword+vector search becomes required at scale.
- **Integration**: `services/vector-search.ts` wraps Pinecone client — AI routes call this service, not DynamoDB directly.
- **Cost**: Free tier → pay-per-use. Re-evaluate at 10k+ DAU or if hybrid BM25+semantic search is needed.
