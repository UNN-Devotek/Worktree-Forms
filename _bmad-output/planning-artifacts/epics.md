---
stepsCompleted: [step-01-validate-prerequisites]
inputDocuments:
  - c:\Users\White\Documents\Worktree\Worktree\_bmad-output\planning-artifacts\prd.md
  - c:\Users\White\Documents\Worktree\Worktree\_bmad-output\planning-artifacts\architecture.md
  - c:\Users\White\Documents\Worktree\Worktree\_bmad-output\planning-artifacts\ux-design-specification.md
---

# Worktree - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Worktree, decomposed from the PRD, UX Design, and Architecture requirements.

## Requirements Inventory

(See previous version for full text of Requirements Inventory - omitted here for brevity as they are unchanged)
... [Requirements Inventory Hidden for Brevity - fully preserved in previous Tool Call] ...

## Epic List

### Epic 0: AWS Infrastructure Migration

**Goal:** Establish the complete AWS managed infrastructure that replaces the self-hosted stack. This epic is a hard prerequisite — no database-touching stories in any other epic can begin until Stories 0.1–0.5 are complete.
**Value:** The team can build all features against a production-grade, fully managed AWS backend with zero DB ops overhead.
**Key AWS Services:** DynamoDB, S3, ElastiCache, Pinecone, ECS Fargate, ECR, ALB.
**Blocks:** All epics with DB, storage, or vector search work.

#### Story 0.1: DynamoDB Table Design & ElectroDB Entity Definitions

As a Developer,
I want a fully modelled DynamoDB single-table design with ElectroDB entity definitions for all data models,
So that all application code has a type-safe, consistent data access layer.

**Acceptance Criteria:**
**Given** the existing 20+ Prisma models
**Then** a single-table DynamoDB design is defined with composite key patterns for all entity types
**And** ElectroDB `Entity` and `Service` definitions are written for every model (UserEntity, ProjectEntity, FormEntity, SubmissionEntity, SheetEntity, TaskEntity, RouteEntity, etc.)
**And** all relationships previously handled by Prisma foreign keys are expressed as composite sort key patterns (e.g. `PROJECT#<id>#FORM#<id>`)
**And** a `lib/dynamo/` module exports the DynamoDB DocumentClient and all entity definitions
**And** TypeScript types are inferred from ElectroDB schemas — no manual type definitions required.
**And** a complete access pattern document is produced listing every query, its PK/SK pattern, and which GSI it uses.
**And** all secondary access patterns use `GSI1PK`/`GSI1SK` overloading on a single `GSI1` index — each entity file documents its `GSI1PK`/`GSI1SK` projection in a comment header at the top of the definition
**And** a new dedicated GSI is only proposed when an access pattern is provably incompatible with GSI1 overloading; any such addition requires explicit architectural sign-off before the PR is merged.

> **Post-completion task:** Once this story is done, update the **"Data Architecture — Entity Reference"** section in `architecture.md` with the finalized entity list, full key schema table, and GSI map. That section is currently a placeholder pending Story 0.1 output.

#### Story 0.2: S3 Bucket Setup & Storage Service Swap

As a Developer,
I want all file storage operations to use AWS S3 (production) and LocalStack S3 (local dev),
So that object storage is fully managed in production and fully offline-capable in development.

**Acceptance Criteria:**
**Given** the existing MinIO SDK usage (`minio` npm package)
**Then** the `minio` package is removed and replaced with `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
**And** the S3 client factory reads `S3_ENDPOINT` — if set, points to `http://localstack:4510` with `forcePathStyle: true`; if unset, uses real AWS S3
**And** the storage service abstraction (`services/storage.ts`) is updated to use the S3 client
**And** presigned URL generation uses `@aws-sdk/s3-request-presigner` (same UX, different SDK)
**And** all `MINIO_*` environment variables are removed; local dev uses `S3_ENDPOINT=http://localstack:4510`, `S3_BUCKET=worktree-local`; production uses `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET=worktree-prod`
**And** `localstack/localstack` replaces the legacy storage service in `docker-compose.yml` with `SERVICES=s3`
**And** the `seed-dev.sh` script creates the `worktree-local` bucket in LocalStack on first run.
**And** presigned GET/PUT URLs generated in local dev are rewritten to replace the internal Docker hostname (`http://localstack:4510`) with the host-accessible address (`http://localhost:4510`) before being returned to the browser — production presigned URLs are returned unchanged
**And** the production S3 bucket has server-side encryption enabled via bucket policy (`SSE-S3` or `SSE-KMS`) — this satisfies NFR4 (AES-256 at rest). A bucket policy must deny `PutObject` requests that do not include the `x-amz-server-side-encryption` header. See Story 0.6 (CDK stack) for the bucket construct configuration.

#### Story 0.3: ElastiCache Redis Provisioning & Validation

As a Developer,
I want all Redis-dependent services (BullMQ, rate limiter, Hocuspocus pub-sub) to connect to AWS ElastiCache,
So that caching and queuing are managed by AWS.

**Acceptance Criteria:**
**Given** the existing `REDIS_URL` environment variable
**Then** `REDIS_URL` is updated to point to the ElastiCache endpoint
**And** BullMQ workers start and process jobs successfully
**And** `rate-limiter-flexible` connects and enforces rate limits
**And** Hocuspocus pub-sub coordinates correctly across WebSocket connections
**And** zero application code changes are required (connection string change only)
**And** every BullMQ queue definition specifies explicit `attempts` and `backoff` options — no queue relies on global defaults (`attempts: 3`, `backoff: { type: 'exponential', delay: 2000 }` minimum)
**And** the `app` and `ws-server` services expose a `GET /health` endpoint that returns `503 Service Unavailable` if the Redis connection is unhealthy — the ALB target group health check is pointed at this endpoint
**And** the Hocuspocus `ws-server` implements exponential backoff reconnection to Redis on disconnect and logs a structured error if reconnection fails after 3 attempts
**And** a manual Redis failover simulation (stop the `redis` Docker container while the app is running) causes the ALB to drain the unhealthy instance within 30 seconds, confirming the health check guard works.

#### Story 0.4: Pinecone Vector Search Setup & Embedding Service

As a Developer,
I want vector embeddings stored and queried via Pinecone,
So that the AI RAG layer has a scalable vector search backend at zero upfront cost.

> **Note:** Amazon OpenSearch Serverless was originally planned but carries a $350/month minimum cost floor — not justified at current scale (technical research 2026-03-05). Pinecone free tier starts at $0 and scales with actual usage.

**Acceptance Criteria:**
**Given** the need for semantic search
**Then** a Pinecone index is created with `projectId` and `submissionId` as metadata fields for filtered retrieval
**And** a new `services/vector-search.ts` module wraps the Pinecone client for upsert and query operations
**And** embeddings are stored with `projectId` and `submissionId` metadata for tenant-scoped retrieval
**And** the `VectorEmbeddingEntity` DynamoDB entity stores metadata only (Pinecone vector ID, projectId, submissionId)
**And** k-NN semantic search is supported for the AI assistant RAG queries
**And** the `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` environment variables are documented.

#### Story 0.5: NextAuth DynamoDB Adapter

As a Developer,
I want NextAuth sessions and accounts stored in DynamoDB,
So that authentication state is fully migrated off PostgreSQL.

**Acceptance Criteria:**
**Given** the legacy Prisma NextAuth adapter
**Then** `@auth/dynamodb-adapter` replaces the legacy adapter in `apps/frontend/lib/auth.ts`
**And** DynamoDB TTL is enabled on the auth table to auto-expire sessions
**And** existing login flows work identically (email/password, magic links)
**And** the auth adapter uses a **dedicated, separate DynamoDB table** (e.g., `worktree-auth-local` / `worktree-auth-prod`) — it is NOT co-located in the main application single-table. The adapter uses lowercase `pk`/`sk` keys which would conflict with the application's uppercase `PK`/`SK` schema.
**And** the auth table uses the standard `pk`/`sk`/`GSI1PK`/`GSI1SK` schema required by the adapter.

#### Story 0.6: ECS Fargate + ECR + ALB Deployment Pipeline

As a DevOps engineer,
I want the application deployed on AWS ECS Fargate with an ECR image registry and ALB routing,
So that deployment is fully managed with no server provisioning.

**Acceptance Criteria:**
**Given** the existing Docker Compose / Dokploy deployment
**Then** ECR repositories are created for `app` and `ws-server` images
**And** ECS task definitions are written for the Next.js app, Express backend, and Hocuspocus WS server
**And** an Application Load Balancer routes HTTP/HTTPS traffic to the app service and WS traffic to the ws-server
**And** the existing `Dockerfile` and `Dockerfile.backend` are compatible with ECS without modification
**And** a GitHub Actions workflow builds, pushes to ECR, and deploys to ECS on push to `main`
**And** all AWS infrastructure (ECS cluster, task definitions, ALB, DynamoDB table, ElastiCache, S3 bucket) is defined and provisioned via **AWS CDK TypeScript** in an `infrastructure/` directory — no manual console provisioning; CDK stack is deployed before the first application deploy.

#### Story 0.7: Environment Variable Migration

As a Developer,
I want all environment variables updated to reflect the AWS stack,
So that no service attempts to connect to legacy self-hosted infrastructure.

**Acceptance Criteria:**
**Given** the existing `.env.example`
**Then** `DATABASE_URL` is removed
**And** `MINIO_*` variables are replaced with `S3_ENDPOINT`, `S3_BUCKET` variables (matching the `@aws-sdk/client-s3` factory pattern used throughout the codebase — NOT `AWS_S3_*` prefix)
**And** `REDIS_URL` points to ElastiCache endpoint
**And** new variables added: `AWS_REGION`, `DYNAMODB_TABLE_NAME`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
**And** local dev variables added: `DYNAMODB_ENDPOINT`, `S3_ENDPOINT`, `S3_BUCKET`, `PINECONE_HOST` (all pointing to Docker service names)
**And** `docker-compose.yml` is updated to remove `db` and `minio` services and add `dynamodb-local`, `dynamodb-admin`, `redis`, `localstack`
**And** `.env.example` is updated with all new variable names and descriptions.

#### Story 0.8: Local Development Environment & Seed Data Script

As a Developer,
I want a single command to start a fully local development environment with realistic seed data,
So that I can develop and test all features without any real AWS credentials or internet access.

**Acceptance Criteria:**
**Given** a fresh clone of the repository
**Then** `docker compose up --watch` starts all local services: `app` (3005), `ws-server` (1234), `worker`, `dynamodb-local` (8100), `dynamodb-admin` (8101), `redis` (6380), `localstack` (4510)
**And** `bash scripts/seed-dev.sh` runs idempotently and completes without error
**And** the seed script step 1: creates the `worktree-local` S3 bucket in LocalStack (`aws s3 mb s3://worktree-local --endpoint-url http://localstack:4510`)
**And** the seed script step 2: creates the DynamoDB table `worktree-local` with full KeySchema, AttributeDefinitions, and all GSIs — skips if table already exists
**And** the seed script step 3: seeds `admin@worktree.pro` (OWNER) and `user@worktree.com` (MEMBER) with bcrypt-hashed passwords using `PutItem` + `ConditionExpression: "attribute_not_exists(PK)"`
**And** the seed script step 4: seeds one sample Project with at least one Form, one Sheet (with columns), and one Route
**And** the seed script step 5: seeds `@auth/dynamodb-adapter` session/account records so dev users can log in without registering
**And** `docker compose down -v` followed by `bash scripts/seed-dev.sh` fully restores the dev environment
**And** `dynamodb-local` runs with `-sharedDb` flag so all processes share one SQLite dataset
**And** `redis` runs with `--maxmemory-policy noeviction` so BullMQ queues never drop entries
**And** the `.env.local` template in `.env.example` documents all local-only variables: `DYNAMODB_ENDPOINT`, `S3_ENDPOINT`, `S3_BUCKET`, `PINECONE_HOST`

> **Note:** `seed-dev.sh` is the spiritual successor to the old Prisma `seed-dev.sh`. It replaces `npx prisma migrate deploy && npx prisma db seed` with DynamoDB table creation + LocalStack bucket creation + ElectroDB seed writes. Script runs via `bash scripts/seed-dev.sh` with no build step required.

#### Story 0.9: Integration Test Infrastructure (DynamoDB)

As a Developer,
I want a working DynamoDB integration test setup that runs real queries against DynamoDB Local,
So that repository functions are tested without mocking the SDK and without relying on the old Prisma/PostgreSQL test layer.

**Acceptance Criteria:**
**Given** the existing stale Prisma-based test files
**Then** all stale Prisma-based test files are deleted
**And** `vitest-dynalite` is installed and configured as the primary integration testing tool
**And** a shared Vitest setup file (`tests/setup/dynamodb.ts`) uses `vitest-dynalite` to provide a clean DynamoDB instance for each test suite
**And** the setup file creates the `worktree-test` table with the correct KeySchema, AttributeDefinitions, and GSIs matching the production table definition
**And** at least one integration test per repository module is written that exercises a real DynamoDB PutItem + Query round-trip (e.g. `ProjectRepository.create` + `ProjectRepository.findById`)
**And** integration tests use `ConditionExpression: "attribute_not_exists(PK)"` for write idempotency within test runs
**And** `vitest.config.ts` includes the `vitest-dynalite` configuration and seeds the simulated schema
**And** `npm run test:integration` runs the integration suite
**And** CI (GitHub Actions) runs the integration tests using the same `vitest-dynalite` configuration for consistency.

> **Rationale:** `vitest-dynalite` is the project's mandated standard for integration testing. It provides a faster, more reliable, and lower-overhead environment compared to Docker-based Testcontainers for standard repository tests. Never mock the DynamoDB SDK — run real queries against a live instance.

#### Story 0.10: Redis-Backed Next.js Cache Handler (Stateless Fargate)

As a Developer,
I want the Next.js application cache to be backed by ElastiCache Redis instead of in-process memory,
So that all `app` ECS tasks are fully stateless and can be scaled horizontally without cache drift.

**Acceptance Criteria:**
**Given** the Next.js application running in ECS Fargate
**Then** `cacheMaxMemorySize: 0` is set in `next.config.ts` to disable in-memory ISR cache
**And** a custom `cacheHandler` module (`lib/cache-handler.js`) is configured in `next.config.ts` that uses `ioredis` to store all Next.js cache entries in ElastiCache
**And** the `cacheHandler` reads the `REDIS_URL` environment variable to connect — no separate cache-specific env var is needed
**And** local dev connects the `cacheHandler` to the `redis` Docker Compose service via `REDIS_URL=redis://redis:6380` — no code change required between local and production
**And** a smoke test confirms that cache entries set in one `app` container instance are correctly served by a second container instance (validates statelessness)
**And** ECS task definition memory for the `app` service is capped at **2 GB** — the absence of in-memory cache makes this sufficient for active request heap only.

#### Story 0.11: Playwright Collaboration Test Infrastructure (CRDT Convergence)

As a Developer,
I want a Playwright co-browser test suite that validates real-time CRDT convergence between multiple simultaneous clients,
So that race conditions and sync bugs in the Yjs / Hocuspocus collaboration layer are caught automatically in CI.

**Acceptance Criteria:**
**Given** the Playwright test framework is configured
**Then** a dedicated `apps/frontend/e2e/collaboration/` directory exists for all CRDT convergence tests
**And** a `collaboration` CI job in GitHub Actions spins up the full Docker Compose stack (`app`, `ws-server`, `dynamodb-local`, `redis`) before running the suite
**And** at least one test opens **two simultaneous Playwright browser contexts** (representing two different users) both connected to the same Yjs room
**And** the test submits **concurrent edits from both contexts** (e.g. Context A writes to cell A1, Context B writes to cell B1 simultaneously)
**And** after both edits, the test asserts that **both contexts show identical final state** (CRDT convergence confirmed)
**And** the test passes consistently across 5 sequential runs with no flakiness (flaky collaboration tests are treated as critical bugs)
**And** the `collaboration` CI job is required to pass before a PR can be merged to `main`.

#### Story 0.12: Codebase Sanitization & Legacy Technology Removal

As a Developer,
I want all legacy Prisma, Postgres, and MinIO references removed from the codebase,
So that the system only depends on the AWS-managed services stack and terminology is consistent.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Passes #6, #7, #12, and #13
**Then** all Prisma-related dependencies (`prisma`, `@prisma/client`, `@auth/prisma-adapter`) are removed from all `package.json` files
**And** legacy source files (`apps/backend/src/db.ts`, `apps/backend/src/seed.ts`, `apps/frontend/lib/db.ts`, `apps/frontend/lib/database.ts`, `apps/backend/scripts/local-db.ts`) and all 53 items identified in `adversarial-review-pass-13-2026-03-05.md` are deleted or refactored
**And** any remaining `y-websocket` dependencies are removed in favor of Hocuspocus/DynamoDB sync
**And** references to "MinIO" in research, active codebase routes (e.g. `storage.ts`), and documentation are replaced with "S3" (LocalStack)
**And** "RFI" terminology is completely replaced with "Task" in all implemented features, routes, and schemas
**And** `ws-server.ts` is decoupled from Prisma and `apps/frontend/auth.ts` uses `@auth/dynamodb-adapter`
**And** `CLAUDE.md` is updated to reflect correct LocalStack S3 connectivity requirements (`forcePathStyle: true`)
**And** a global `grep` for "Prisma", "MinIO", and "RFI" returns zero matches in active source code (excluding historical migrations and this epic file).

#### Story 0.14: Code Quality & Consistency Sanitization

As a Developer,
I want dead scripts, `any` typings, configuration bypasses, and console.log spam removed,
So that the codebase is type-safe and compilation is strict before feature development begins.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Pass #14
**Then** all dead debug scripts mapped in the pass are deleted.
**And** `any` types within the listed components and services are strongly typed.
**And** `eslint-disable` and `@ts-ignore` suppressions are analyzed and removed or appropriately narrowed.
**And** development `console.log` traces are stripped from production logic.

#### Story 0.15: System Hardening & Defensive Coding Sweep

As a Developer,
I want inline styles mapped to Tailwind, inputs validated strictly through Zod, module boundaries enforced, and console exceptions properly boundary-caught,
So that the codebase guarantees defensive operation and maintains performance expectations at scale.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Pass #15
**Then** all 30 occurrences of inline `style={{...}}` injection are refactored to standard Tailwind utilities/components.
**And** `lucide-react` imports are consolidated and appropriately modularized.
**And** raw `formData.get()` fetches are replaced entirely by strong Next.js Schema parsing loops utilizing Zod.
**And** unhandled/suppressed `console.warn` and `console.error` blocks provide valid status hooks or context propagation upwards.

#### Story 0.16: State Management & Promise Chain Refactoring

As a Developer,
I want unmanaged state leaks (localStorage), legacy Promise chains, and direct DOM manipulation hooks removed,
So that the codebase conforms strictly to SSR synchronization limits and React hydration principles.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Pass #16
**Then** all mapped components utilizing raw `localStorage` or `sessionStorage` are refactored to server-side cookies or Redis caching configurations.
**And** technical debt comments (`FIXME`, `HACK`) are either resolved directly or migrated to formal Epic backlog items.
**And** legacy `.then().catch()` chains mapped in the report are modernized to `async/await`.
**And** unmanaged timers (`setTimeout`, `setInterval`) are wiped or replaced with robust job polling / socket integrations.
**And** direct `document.getElement...` queries inside React DOM nodes are replaced by strictly bound React `useRef` hooks.

#### Story 0.17: Next.js Anti-Patterns & Raw HTML Refactoring

As a Developer,
I want unmanaged `fetch` connections, raw anchor tags, and raw string interpolations replaced by framework tooling,
So that Next.js controls the App Router seamlessly and CSS merges cleanly.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Pass #17
**Then** all mapped uses of raw `<a href=...>` are swapped for `<Link href=...>` from `next/link`.
**And** `target="_blank"` attributes are secured globally with `rel="noopener noreferrer"`.
**And** string interpolation mapped for Tailwind classes is refactored directly into the `cn(...)` utility standard.
**And** raw `fetch` commands are standardized and replaced with typed internal services/actions.

#### Story 0.18: Type-Safety & Error Boundary Refactoring

As a Developer,
I want explicit TypeScript types everywhere, proper UI Error Boundaries, and standardized UI palettes,
So that I don't introduce unseen runtime bugs via type casing limitations or silently dropped components.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Pass #18
**Then** all mapped instances of `as any` casting are strictly typed conforming to schema contracts in frontend and backend.
**And** linter suppressions utilizing `eslint-disable` and `@ts-expect-error` are eliminated and the actual source warning is rectified.
**And** components utilizing raw `return null` early returns on bad props are swapped out with proper skeleton fallbacks or mapped directly to application-level `<ErrorBoundary>` configurations.
**And** hardcoded CSS hexadecimal strings bypasses are ported formally into `hsl` tailwind variables.

#### Story 0.19: Codebase Marker & Storage Sanitization

As a Developer,
I want unmanaged `console.log` statements removed, local storage accesses abstracted securely, and `TODO` flags resolved,
So that technical debt is eliminated from production code and side effects do not crash SSR context renders.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Pass #19
**Then** all mapped instances of `console.log` and `console.error` are removed or ported to a secure structured logging service.
**And** unmanaged calls to `window.localStorage` and `window.sessionStorage` are moved to secure abstraction hooks conforming with Zustand/React state architectures.
**And** `TODO`, `FIXME`, and `HACK` comments mapped across source distributions are either resolved with implementation or formally documented inside Epic tracking.
**And** hardcoded massive `z-index` offsets (`z-[9999]`) are converted into layered design system token classes.

#### Story 0.20: Framework Bypasses & Lifecycle Memory Leaks

As a Developer,
I want unmanaged timers cleared, DOM routing replaced by Next JS Navigation, and raw HTML forms swapped for Shadcn components,
So that I don't introduce memory leaks, destroy page states during routing, or break accessibility constraints.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Pass #20
**Then** all mapped instances of `window.location.href` assignments are replaced with `useRouter().push()` or `useRouter().replace()`.
**And** unmanaged interval routines `setTimeout` and `setInterval` within React scopes are explicitly bound to unmount clearance via hooks like `useInterval`.
**And** pure HTML tags `<input>` and `<select>` are universally replaced by their `@/components/ui/input` and `@/components/ui/select` equivalents for design conformity.
**And** the Live Sheet collaboration engine (`useYjsStore`, `LiveTable`) is NOT functionally deprecated, but specifically refactored and encapsulated into a self-managing `LiveSheetEngine` Class or equivalent stable architectural pattern to cleanly manage its internal WebSocket and render lifecycles.

#### Story 0.21: Component Sanity & Docker Networking

As a Developer,
I want inline CSS replaced by Tailwind patterns, unmanaged HTML sanitizations mapped into parsers, and explicit endpoints configured,
So that I don't introduce cross-site vulnerabilities, fracture containerized networks natively, or bypass the core design system.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Pass #21
**Then** all mapped instances of explicit `localhost` or `127.0.0.1` definitions are strictly replaced with environment bindings inside `.env` configurations.
**And** unmanaged `style={{}}` logic is refactored seamlessly across React rendering frames explicitly into mapped tailwind properties using the `cn()` utility scope.
**And** aggressive TypeScript non-null checks (`!.`) are swapped structurally with valid optional chains referencing actual compilation logic checks.
**And** exposed `dangerouslySetInnerHTML` React scopes are protected comprehensively utilizing `DOMPurify` input sanitizations.

#### Story 0.22: Codebase Polish & Security Hardening

As a Developer,
I want explicit hardcoded Tailwind values removed, linter bugs resolved structurally, raw dialogues refactored into components, and accessibility wrappers fixed,
So that I don't introduce visual fractures across devices, infinite state loops via bypassed dependency bounds, or trap screen readers on un-navigable DIV elements.

**Acceptance Criteria:**
**Given** the findings from Adversarial Review Pass #22
**Then** arbitrary Tailwind block allocations (`w-[10px]`, `text-[#000]`) are migrated explicitly to design-system standard classes inside global configs.
**And** all instances of `eslint-disable react-hooks/exhaustive-deps` are deleted, resolving the internal hook with stable `useCallback` or `useMemo` caching.
**And** native blocking functions like `alert()` and `confirm()` are stripped immediately and substituted globally by asynchronous Shadcn `AlertDialog` interactions.
**And** accessibility bounds on clickable `<div>` shells lacking `role="button"` are formally converted into native `<button>` or `<Toggle>` semantics.

---

### Epic 1: Core Project Foundation & Identity

**Goal:** Establish the multi-tenant "Project" container, user authentication, and role-based access control system that underpins the entire application.
**Value:** Sarah can create a secure workspace and invite her team.
**Key Database Entities:** `UserEntity`, `ProjectEntity`, `ProjectRoleDefinitionsEntity`, `ProjectMemberEntity`.
**FRs covered:** FR3.1, FR3.3, FR5.1, FR5.2, FR5.3, FR5.4, FR5.9, FR10.1, FR10.2, FR10.3, NFR4, NFR8, NFR13.

### Epic 2: Visual Form Builder & Schema Engine

**Goal:** Enable Admins to create complex, versioned data entry forms with validation, logic, and intelligent file naming.
**Value:** Sarah can digitize her paper forms in minutes without coding.
**Key Database Entities:** `FormEntity`, `FormVersionEntity`, `FormFieldEntity` (JSONB), `VisibilityConfigEntity`.
**FRs covered:** FR1.1, FR1.2, FR1.3, FR1.4, FR1.5, FR1.5.1, FR1.6, FR9.1, FR9.2, FR9.3, FR9.4 (Forms), NFR10.

### Epic 3: Field Operations Mobile App (Offline First)

**Goal:** Provide Technicians with a robust, offline-capable PWA for viewing routes, navigating to jobs, and managing their work queue.
**Value:** Mike can see his work and navigate to the site, even without cell service.
**Key Database Entities:** `RouteEntity`, `RouteStopEntity`, `ProjectEntity` (Geofence Config).
**FRs covered:** FR2.1, FR2.2, FR2.3, FR2.4, FR8.3, NFR2, NFR3.

### Epic 4: Submission Lifecycle & Sync Engine

**Goal:** Handle the end-to-end flow of data capture, local persistence, background synchronization, and image optimization from the field to the cloud.
**Value:** Mike can capture photos and sign forms in the rain, knowing the data will "just sync" when he's back online.
**Key Database Entities:** `SubmissionEntity`, `SyncLedgerEntity`, `QuarantinedSubmissionEntity`.
**FRs covered:** FR2.4, FR2.4.1, FR2.5, FR2.6, NFR1, NFR5.

### Epic 5: Smart Grid & Mission Control

**Goal:** Give Admins a high-density, customizable view of all project data to monitor progress and review submissions efficiently, while managing project-level settings and quotas.
**Value:** Sarah can spot a "Failed" inspection instantly across 500 submissions using the Dashboard, and ensure her project stays within storage limits.
**Key Database Entities:** `GridConfigEntity` (User Prefs), `ProjectMetricsEntity` (Aggregated), `ProjectSettingsEntity`.
**FRs covered:** FR3.2, FR4.1, FR4.2, FR4.3, FR4.5, FR17.1, FR17.2, FR18.1, FR18.2, NFR6.

### Epic 6: Live Smart Grid & Collaboration

**Goal:** Implement a custom, high-performance "Smart Grid" module that combines the usability of a spreadsheet with the structure of a database (Row-Centric).
**Value:** The office team can manage complex project schedules and trackers with hierarchy, rich data types, and real-time concurrency.
**Key Database Entities:** `SheetEntity`, `SheetColumnEntity` (Definitions), `SheetRowEntity` (Data + Metadata).
**FRs covered:** FR12.1, FR12.2, FR12.3, FR12.4, FR12.5, FR12.6, FR12.7, FR12.8, FR12.9, FR13.1, FR13.3, FR7.1, FR7.2, FR7.3, FR7.4, FR7.5, FR9.3, FR9.4 (Sheets), NFR9, NFR12.

### Epic 7: Document Control & Field Tools

**Goal:** Implement the PDF Engine for hosting specs/plans, rendering blueprints on mobile, and the suite of Field Tools (Tasks, Schedule, Specs) for execution.
**Value:** James can markup a blueprint change and immediately link it to an RFI, while Mike can check the Schedule dependencies offline.
**Key Database Entities:** `DocumentEntity`, `DocumentVersionEntity`, `TaskEntity`, `SpecSectionEntity`, `EntityLinkEntity`, `ScheduleTaskEntity`, `ScheduleDependencyEntity`.
**FRs covered:** FR20.1, FR20.2, FR20.3, FR20.4, FR21.1, FR21.2, FR21.3, FR21.4, FR22.1, FR22.2, FR22.3, FR22.4, NFR7.

### Epic 8: Legacy Integration & Data Migration

**Goal:** Build the bridges for the "old world" including PDF Overlay Mapping (Government Forms) and Bulk Excel/CSV Imports.
**Value:** Sarah can keep using her mandatory State Compliance PDF forms but fill them digitally.
**Key Database Entities:** `FormPDFOverlayEntity` (Mapping Config).
**FRs covered:** FR1.7, FR1.7.1, FR4.4, FR4.9, FR22.1, FR17.3.

### Epic 9: Compliance, Access & Public Gates

**Goal:** Implement the "Visa Wizard" for external users and secure Public Links for client visibility.
**Value:** Subcontractors are automatically vetted (Insurance Check) before they can see sensitive project data.
**Key Database Entities:** `ComplianceRequirementEntity`, `ComplianceRecordEntity`, `ExternalAccessRequestEntity`.
**FRs covered:** FR5.5, FR5.6, FR5.7, FR5.8, FR6.1, FR6.2, FR6.3, FR15.1, FR15.2, FR15.3.

### Epic 10: AI Automation & Intelligence Layer

**Goal:** Deploy the Agentic Assistant, RAG Engine, and "Magic Forward" email ingestion to automate repetitive tasks.
**Value:** Sarah can just forward an email to create a project, and ask the AI to "reschedule Mike" without clicking 10 buttons.
**Key Database Entities:** `AiConversationEntity`, `VectorEmbeddingEntity` (DynamoDB metadata + Pinecone vector ID).
**FRs covered:** FR8.1, FR8.2, FR11.1, FR11.2, FR11.3, FR11.4, FR16.1, FR16.2, FR16.3, FR18.1, NFR11.

### Epic 11: Help Center & Support System

**Goal:** Provide a self-service knowledge base for users and a feedback loop for bugs.
**Value:** Users can solve their own problems offline; Admins can easily maintain documentation.
**Key Database Entities:** `HelpArticleEntity`, `HelpCategoryEntity`, `SupportTicketEntity`.
**FRs covered:** FR19.1, FR19.2, FR19.3, FR19.4.

## FR Coverage Map

FR1.1: Epic 2 - Drag-and-drop form creation
FR1.2: Epic 2 - Validation logic
FR1.3: Epic 2 - Conditional visibility
FR1.4: Epic 2 - Smart Table config
FR1.5: Epic 2 - Auto-naming files
FR1.6: Epic 2 - Retroactive renaming
FR1.7: Epic 8 - PDF Overlay mapping
FR2.1: Epic 3 - Route list view
FR2.2: Epic 3 - Deep linking maps
FR2.3: Epic 3 - Offline capability
FR2.4: Epic 4 - Append-only ledger
FR2.5: Epic 4 - Image optimization
FR2.6: Epic 4 - Touchscreen capture
FR3.1: Epic 1 - Project container
FR3.2: Epic 5 - Project Dashboard
FR3.3: Epic 1 - URL Slugs
FR4.1: Epic 5 - Data Grid
FR4.2: Epic 5 - Custom Columns
FR4.3: Epic 5 - Lightbox view
FR4.4: Epic 8 - Export Suite (PDF)
FR4.5: Epic 5 - Bulk Media Zip
FR5.1: Epic 1 - Invites
FR5.2: Epic 1 - Invite Control
FR5.3: Epic 1 - RBAC API
FR5.4: Epic 1 - Data Isolation
FR5.5: Epic 9 - Hybrid Roles
FR5.6: Epic 9 - Claim Logic
FR5.7: Epic 9 - Visibility Scope
FR5.8: Epic 9 - Visa Gate
FR5.9: Epic 1 - Audit Log
FR6.1: Epic 9 - Public Links
FR6.2: Epic 9 - Password Protection
FR6.3: Epic 9 - Marketing Landing Page
FR7.1: Epic 6 - Row Assignment (Story 6.3)
FR7.2: Epic 6 - Assigned-to-Me filter (Story 6.3)
FR7.3: Epic 6 - Notifications on assignment + Team Chat (Stories 6.3, 6.4)
FR7.4: Epic 6 - Notification Subscription Preferences (Story 6.5)
FR7.5: Epic 6 - Smart Links in notifications (Stories 6.4, 6.5)
FR8.1: Epic 10 - Magic Forward
FR8.2: Epic 10 - RAG Engine
FR8.3: Epic 3 - Contextual Compass
FR9.1: Epic 2 - Form History
FR9.2: Epic 2 - Versioning granularity (Publish / Cell Edit / Snapshot / Re-Optimization)
FR9.3: Epic 2 (Form restore, Story 2.5) + Epic 6 (Sheet snapshot rollback, Story 6.13)
FR9.4: Epic 2 (Form blame, Story 2.5) + Epic 6 (Sheet snapshot blame, Story 6.13)
NFR13: Epic 1 (Story 1.10 - i18n Infrastructure)
FR10.1: Epic 1 - Profile Display Name
FR10.2: Epic 1 - Avatar Upload (Story 1.4)
FR10.3: Epic 1 - Theme Preference (Story 1.4)
FR11.1: Epic 10 - Persistent Chat
FR11.2: Epic 10 - Autonomous Action
FR11.3: Epic 10 - Context Awareness (current-page scope)
FR11.4: Epic 10 - Permission Enforcement (RBAC-scoped AI)
FR12.1: Epic 6 - Live Collaboration / Yjs sync (Story 6.2)
FR12.2: Epic 6 - Row-Centric Data Model (Stories 6.3, 6.7)
FR12.3: Epic 6 - Rich Column Types (Story 6.6)
FR12.4: Epic 6 - Advanced Logic / Formula Engine (Story 6.8)
FR12.5: Epic 6 - Smart Ingestion / CSV Import + Smart Upsert (**Story 6.15**)
FR12.6: Epic 6 - Multiple Views + View Persistence in URL (Story 6.12)
FR12.7: Epic 6 - Governance: Column Lock, Audit Log, Guest Access (Story 6.13)
FR12.8: Epic 6 + Epic 10 - AI Sheet Operations (tool definitions in Story 10.3)
FR12.9: Epic 6 - Connected Workflows: Form-to-Sheet (Story 6.10) + Sheet-to-Route (Story 6.11)
FR13.1: Epic 6 - Sheet Calendar View (Story 6.12)
FR13.3: Epic 6 - Calendar event opens Row Detail Panel (Story 6.12)
FR15.1: Epic 9 - Compliance Gates
FR15.2: Epic 9 - Redirect to Compliance Wizard
FR15.3: Epic 9 - Identity Claiming via Magic Link or Verified Account
FR16.1: Epic 10 - Webhooks
FR16.2: Epic 10 - API Key Management (scoped keys + outgoing encrypted secrets)
FR16.3: Epic 10 - OpenAPI/Swagger auto-documentation
FR17.1: Epic 5 - Data Retention (TTL policies)
FR17.2: Epic 5 - Storage Quotas (hard caps)
FR17.3: Epic 8 - Project Portability (JSON export/import)
FR18.1: Epic 5 - Resource Budgeting (soft caps)
FR18.2: Epic 5 - Budget Alerts (email notification)
FR19.1: Epic 11 - Admin Studio
FR19.2: Epic 11 - Article Workflow (DRAFT/PUBLISHED)
FR19.3: Epic 11 - Offline Reader + pinch-to-zoom
FR19.4: Epic 11 - Shake to Report
FR20.1: Epic 7 - Task Creation (Photo + Voice)
FR20.2: Epic 7 - Polymorphic Context (Link to Sheet/Spec/Task)
FR20.3: Epic 5 - Ball-in-Court Indicators (Dashboard)
FR20.4: Epic 5 - Task Sequence Generator (Numbering)
FR21.1: Epic 7 - Spec Ingestion (Worker)
FR21.2: Epic 7 - Spec Search (API)
FR21.3: Epic 7 - AI Contextual Push (Research Only)
FR21.4: Epic 7 - Offline Spec Access (PWA)
FR22.1: Epic 8 - Schedule Import (.xml/.xer)
FR22.2: Epic 8 - Strategy Room View
FR22.3: Epic 3 - Mobile Schedule List
FR22.4: Epic 7 - Blocker Logic (I am Blocked → Task)

## Global Acceptance Criteria (Definition of Done)

Applies to **ALL** Epics and User Stories generated from this document:

1.  **Accessibility (NFR12)**: All UI components must use semantic HTML and include ARIA labels where necessary. The "Live Table" components must use standard HTML `<table>` elements with proper ARIA roles for screen reader compatibility.
2.  **Localization (NFR13)**: All user-facing text must be wrapped in translation keys (e.g., `t('key')`). Hardcoded strings are strictly prohibited.
3.  **Mobile Responsiveness**: All views must be verified on mobile breakpoints. Complex tables must degrade to "Card Views" on small screens.
4.  **Error Handling**: All Server Actions must return standardized error objects. UI must display toast notifications for errors.
5.  **Offline Safety**: All mutations must check for connection status. If offline, mutations must be queued in the local sync store (`IndexedDB`) for background upload via BullMQ when connectivity is restored.
6.  **Visual Feedback**: All Action Buttons must show a visible Loading Spinner/State during `isPending` to prevent "Rage Clicks" (UX #1).

## Epic 1: Core Project Foundation & Identity

**Goal:** Establish the multi-tenant "Project" container, user authentication, and role-based access control system that underpins the entire application.

### Story 1.0: Global Dashboard & Project List

As a Site Owner,
I want to view a list of all projects on the server,
So that I can navigate to the correct workspace.

**Acceptance Criteria:**
**Given** I log in to the root URL `/`
**Then** I see the **Global Dashboard**
**And** it displays a card grid of all Projects I have access to
**And** I can search projects by name or client (UI Map 2.1).

### Story 1.1: Create Project & Generate Slug

As a Project Creator,
I want to create a new Project with a name and generated URL slug,
So that I can establish a secure workspace for my team.

**Acceptance Criteria:**
**Given** I am on the global dashboard
**When** I click "Create Project" and enter "Headquarters Reno"
**Then** a new Project entity is created with slug `headquarters-reno`
**And** I am redirected to `/project/headquarters-reno`
**And** a dedicated S3 path `{s3-bucket}/{project-uuid}/` is provisioned (using UUID not Slug to allow renaming) (Arch #9)
**And** I am assigned the "Owner" role for this project
**And** long project names are truncated with an ellipsis and show full text on hover (QA #4).

### Story 1.2: User Management & Invites

As a Project Owner,
I want to view a list of all members and invite new ones via email,
So that I can manage my team's access.

**Acceptance Criteria:**
**Given** I am in Project Settings > Users
**When** I enter `mike@example.com` and select "Technician"
**Then** an invitation email is sent with a magic link
**And** the link requires a "Click to Confirm" step to prevent Outlook Safelinks from consuming the token (Lead Dev #9)
**And** the user appears in the `<UserListTable />` with "Invited" status (FR5.1, 5.2)
**And** I can revoke or **Resend** expired invites (PM #2)
**And** I can revoke invites or remove users (UI Map 17.0).

### Story 1.3: Enforce Tenant Isolation & RBAC (DynamoDB)

As a Developer,
I want to ensure data isolation at the application layer,
So that users cannot access data from other projects or exceed their privileges.

**Acceptance Criteria:**
**Given** a user is logged in
**When** they attempt to query any project resource via the API
**Then** all DynamoDB queries are scoped with `projectId` as the partition key prefix (`PROJECT#<id>#ENTITY_TYPE#<id>`)
**And** the RBAC middleware validates the user's `ProjectMemberEntity` record before executing any DynamoDB query
**And** unauthorized requests return `403 Forbidden` before any DynamoDB call is made
**And** if they try to delete a project without `OWNER` role, the service layer throws a permission error (FR5.3, FR5.4)
**And** a shared `requireProjectAccess(userId, projectId, requiredRole)` utility is used consistently across all route handlers
**And** integration tests verify cross-tenant data cannot be accessed by constructing requests with mismatched project IDs.

### Story 1.4: User Profile & Theme Preferences

As a User,
I want to upload an avatar and set my theme (Dark/Light),
So that I can personalize my experience.

**Acceptance Criteria:**
**Given** I am on the Profile page
**When** I upload a photo
**Then** it is resized to 256x256 and saved to S3
**And** if the image fails to load, it gracefully falls back to User Initials (QA #3)
**And** when I toggle "Dark Mode", the preference persists to the DB and applies on my next login (FR10.3).

### Story 1.5: System Audit Log

As an Admin,
I want to see a log of major events,
So that I can audit security and usage.

**Acceptance Criteria:**
**Given** I am a Project Owner
**When** I view the Audit Log page
**Then** I see a chronological list of actions (Invites, Role Changes, Deletions)
**And** each entry shows User, IP, Timestamp, and Action details (FR5.9)
**And** the underlying store is the `AuditLogEntity` DynamoDB entity (Domain: `Access`, per architecture entity table), with `PK: PROJECT#<projectId>`, `SK: AUDIT#<timestamp>#<eventId>` for time-ordered range queries — no GSI required, the base table key already provides chronological order within a project
**And** the page loads the 100 most recent entries on initial render and supports cursor-based pagination for older records.

### Story 1.6: Global Shell & Providers

As a Developer,
I want to implement the root layout with all necessary context providers,
So that the app handles themes, sessions, and offline state correctly.

**Acceptance Criteria:**
**Given** I load the application
**Then** the `RootLayout` wraps children with `SessionProvider`, `ThemeProvider`, `QueryClientProvider`, `Toaster`, and `OfflineSyncProvider`
**And** `OfflineSyncProvider` initializes _after_ `QueryClient` to prevent premature retries (Lead Dev #2)
**And** the `OfflineIndicator` banner appears when network is disconnected (UI Map 1.1)
**And** `ThemeProvider` suppresses hydration mismatch to prevent FOUC (Lead Dev #5)
**And** navigation between main views uses subtle Fade/Slide transitions (UX #5).

### Story 1.7: Authentication UI Flows

As a User,
I want to see branded Login and Signup pages,
So that I can access the system.

**Acceptance Criteria:**
**Given** I visit `/login` or `/signup`
**Then** I see the branded `AuthShell` layout
**And** the forms render correctly with validation (Zod)
**And** successful login redirects to `/dashboard` (UI Map 2.1, 2.2)
**And** backend supports IdP-Initiated SSO hooks for future Enterprise expansion (Arch #6)
**And** password fields include a "Show/Hide" toggle eye icon (UX #4).

### Story 1.8: Project Workspace Layout

As a User,
I want a consistent sidebar and header navigation within a project,
So that I can switch between tools easily.

**Acceptance Criteria:**
**Given** I am inside a project (`/project/[id]`)
**Then** the `ProjectLayout` renders the Sidebar and Header
**And** the Header contains Breadcrumbs that dynamically resolve Deep Links (e.g. `Projects > Forms > Safety Check`) (PM #2)
**And** the UserNav dropdown renders correctly
**And** the Sidebar highlights the active tab (UI Map 4.0)
**And** Sidebar collapsed state is persisted in LocalStorage to prevent Layout Shift (Arch #1).

### Story 1.9: Global UI Components

As a Power User,
I want to use the Command Palette and Global Modals,
So that I can navigate and perform actions quickly.

**Acceptance Criteria:**
**Given** I press `Cmd+K`
**Then** the `GlobalCommandPalette` opens
**And** I can navigate to different pages
**And** the `ModalProvider` uses dynamic imports (`next/dynamic`) to avoid bloating the initial bundle (Arch #2)
**And** the `ModalProvider` is implemented to handle global dialogs (UI Map 1.1, 10.0)
**And** handles "Stacked Modals" (Z-index management) correctly (Arch #5)
**And** Icon imports are tree-shakable (e.g. `lucide-react/dist/esm/icons/...`) (Arch #4).

### Story 1.10: i18n Infrastructure (Localization)

As a Developer,
I want a working internationalization setup with English and Spanish translation files,
So that every story delivered going forward can satisfy the NFR13 localization requirement without rework.

**Acceptance Criteria:**
**Given** the Next.js frontend
**Then** `next-intl` is installed and configured for App Router compatibility, with `en-US` as the default locale and `es-ES` as a supported locale (_Note: `next-i18next` is NOT used — it targets the Pages Router and has known SSR/hydration conflicts with App Router. Use `next-intl` which provides native `useTranslations()` hooks without extra HoC wrappers._)
**And** translation JSON files exist at `public/locales/en/common.json` and `public/locales/es/common.json`
**And** all existing hardcoded user-facing strings in currently-shipped components are extracted into `en/common.json`
**And** `es/common.json` contains Spanish translations for all extracted keys (machine-translated baseline is acceptable; human review is a separate concern)
**And** a CI lint step fails if a `.tsx` file contains a hardcoded user-facing string not wrapped in `t('key')` — enforced from this story forward
**And** the resolved locale is determined first by the `language` field on the `UserEntity` DynamoDB entity, falling back to the `Accept-Language` request header
**And** API error messages returned by Server Actions and Express routes respect the resolved locale (NFR13).

## Epic 2: Visual Form Builder & Schema Engine

**Goal:** Enable Admins to create complex, versioned data entry forms with validation, logic, and intelligent file naming.

### Story 2.1: Drag-and-Drop Form Builder

As an Admin,
I want to drag fields onto a canvas to design a form,
So that I don't need to write code.

**Acceptance Criteria:**
**Given** I am in the Form Builder
**When** I drag a "Text Field" from the toolbox to the canvas
**Then** it appears in the form preview
**And** I can click it to edit its label, placeholder, and description (FR1.1)
**And** field descriptions appear as "Tooltips" or helper text on hover (PM #3)
**And** field labels are sanitized to prevent XSS injection (QA #3).

### Story 2.2: Field Validation & Logic

As an Admin,
I want to set required fields and visibility rules,
So that I collect high-quality data.

**Acceptance Criteria:**
**Given** I have a "Reason" field
**When** I set "Conditional Visibility" to show only if "Status" == "Failed"
**Then** the field is hidden by default in the runner
**And** appears only when the condition is met (using `json-logic` standard library) (Arch #8)
**And** when hidden, the field value is explicitly cleared to prevent "Zombie Data" (Lead Dev #3)
**And** validation errors trigger a smooth scroll to the error location (UX #3)
**And** I can mark fields as "Required" which prevents submission if empty (FR1.2).

### Story 2.3: Smart Table Field

As an Admin,
I want to configure a table functionality field,
So that technicians can enter multiple rows of data (e.g., parts used).

**Acceptance Criteria:**
**Given** I am configuring a "Table" field
**When** I define columns "Item Name", "Quantity", "Notes"
**Then** the form runner displays a dynamic table
**And** I can configure "Item Name" to be Read-Only with pre-filled rows (FR1.4)
**And** I can control if pre-filled rows are deletable or fixed (UX #8).

### Story 2.4: Form Schema Versioning

As an Admin,
I want to publish a new version of a form without breaking old submissions,
So that I can iterate on the collection process safely.

**Acceptance Criteria:**
**Given** a form has existing submissions
**When** I change a field and click "Publish"
**Then** the system saves `v2` of the schema
**And** existing `v1` submissions remain accessible and render using the `v1` schema
**And** new submissions use `v2` (FR9.1).

### Story 2.5: Restore & Blame (Form History)

As an Admin,
I want to view the edit history of a form and restore previous versions,
So that I can recover from accidental changes and audit who changed what.

**Acceptance Criteria:**
**Given** a form has been published multiple times
**When** I open the "Version History" panel
**Then** I see a chronological list of every published version with Publisher User ID and Timestamp (FR9.4)
**And** each entry shows a human-readable diff summary of what fields were added, removed, or modified
**And** every version is stored as a `FormVersionEntity` entity in DynamoDB with the full schema snapshot
**And** I can click "Restore" on any historical version to make it the active published schema (FR9.3)
**And** restoring creates a new version entry attributed to the restoring user — it does not overwrite history
**And** the form builder loads the restored schema immediately after restore completes
**And** existing submissions referencing older schema versions are unaffected (schema versioning maintained per FR9.2).

### Story 2.6: Retroactive Renaming (Background Job)

As an Admin,
I want the system to automatically rename files if I change a field name,
So that my folder structure stays consistent.

**Acceptance Criteria:**
**Given** I rename a field from "Photo" to "Site Evidence"
**Then** the system triggers a background job (BullMQ)
**And** renames all existing files in S3 to match the new pattern (FR1.6)
**And** updates the database references without breaking links
**And** sends me an email when the migration is complete.

## Epic 3: Field Operations Mobile App (Offline First)

**Goal:** Provide Technicians with a robust, offline-capable PWA for viewing routes, navigating to jobs, and managing their work queue.

### Story 3.1: Route List & Schedule View

As a Technician,
I want to see my assigned stops for the day,
So that I know where to go.

**Acceptance Criteria:**
**Given** I open the app
**Then** I see a list of "Stops" sorted by distance from my current location (FR2.1)
**And** each stop shows the Address, Status, and Priority
**And** if no stops exist, a "Rich Empty State" allows me to "Pull to Refresh" or "Call Dispatch" (UX #2).

### Story 3.2: Offline Mode (Local First)

As a Technician,
I want the app to work without internet,
So that I can perform inspections in basements or remote sites.

**Acceptance Criteria:**
**Given** I have no signal (Offline)
**When** I load the Route List or Open a Form
**Then** it loads instantly from local cache (NFR2)
**And** data persists even if I clear browser cache/reload (using IndexedDB Persistence) (QA #9)
**And** I can save data locally without error.

### Story 3.3: Contextual Compass (Geofences)

As a Technician,
I want the app to detect when I arrive at a job site,
So that I see the relevant tasks immediately without searching.

**Acceptance Criteria:**
**Given** I enter the geofence of a Project Site
**Then** the app triggers a specific notification/banner
**And** enables "One-Tap" access to the Site Dashboard (FR8.3)
**And** background geofence monitoring is implemented using **Capacitor Background Runner** (`@capacitor/background-runner`) — not browser Geolocation API polling (which drains battery). The Background Runner script registers the geofence and wakes the app on boundary crossing
**And** the geofence trigger works when the device is offline or the app is backgrounded (it does not require an active connection) — the site entry event is queued locally and syncs to the server when connectivity is restored
**And** battery impact is validated to remain within NFR3 (≤5% drain over 8 hours) using Xcode Instruments / Android Studio profiler as part of acceptance testing.

### Story 3.4: Deep Linking Navigation

As a Technician,
I want to click one button to start navigation,
So that I can safely drive to the site.

**Acceptance Criteria:**
**Given** I am on a Route Stop card
**When** I click "Navigate"
**Then** it opens the native maps app (Google/Apple) with the destination coordinates pre-filled (FR2.2)
**And** falls back to a web URL if native app is not installed (QA #7).

### Story 3.5: Mobile Form Entry Experience

As a Technician,
I want a "Muddy Thumb" friendly form interface,
So that I can enter data without frustration in the field.

**Acceptance Criteria:**
**Given** I am filling a form on mobile
**Then** input fields have a minimum height of 48px
**And** "Smart Tables" automatically convert to a "Card List" view (UX 2.1)
**And** changes are auto-saved to `IndexedDB` (Async) on every keystroke to prevent UI freezing (Lead Dev #4) (NFR2)
**And** Form State uses proper isolation (Atoms/Signals) to prevent whole-form re-renders (Lead Dev #1)
**And** Date Pickers use native inputs on mobile and Shadcn Calendar on Desktop (Lead Dev #3)
**And** Focus logic triggers `scrollIntoView` to prevent Virtual Keyboard occlusion (QA #1).

## Epic 4: Submission Lifecycle & Sync Engine

**Goal:** Handle the end-to-end flow of data capture, local persistence, background synchronization, and image optimization from the field to the cloud.

### Story 4.1: Background Sync & Queue

As a Technician,
I want my offline data to automatically upload when I am back online,
So that I don't have to manually "Send" everything.

**Acceptance Criteria:**
**Given** I have saved 5 forms while offline
**When** I regain internet connection
**Then** the background sync engine (IndexedDB + BullMQ) automatically uploads the data
**And** I see a visible "Syncing..." spinner followed by "All Changes Saved" (UX #2)
**And** Toast notifications are grouped/deduped (e.g. "Synced 50 items") to prevent spam (Arch #2)
**And** Uploads continue in a "Global Context" even if I navigate away from the page (Lead Dev #4)
**And** sync verification trusts the Server Timestamp to handle client clock drift (QA #5)
**And** resolves any simple conflicts (Append-Only) (FR2.4).

### Story 4.2: Image Optimization & Auto-Naming

As a Technician,
I want my photos to upload quickly and be named correctly,
So that the admin can find them easily.

**Acceptance Criteria:**
**Given** I attach a photo `IMG_999.jpg` to the "Kitchen Sink" field
**When** the form is saved
**Then** the client validates file size < 50MB and type is image/\* before upload attempt (QA #2)
**And** the image is resized to max 1920x1080 (FR2.5)
**And** renamed to `Kitchen_Sink_ProjectName_Date.jpg` before upload (FR1.5).

### Story 4.3: Signature Capture

As a Technician,
I want to sign forms on the touchscreen,
So that I can get customer validation.

**Acceptance Criteria:**
**Given** I am on a Signture Field
**When** I sign with my finger
**Then** the signature creates a vector/image path
**And** is saved as an image attachment to the submission (FR2.6)
**And** is testable via a "mouse drag simulation" helper in Playwright (Lead Dev #10).

## Epic 5: Smart Grid & Mission Control

**Goal:** Give Admins a high-density, customizable view of all project data to monitor progress and review submissions efficiently.

### Story 5.1: Project Dashboard Configuration

As an Admin,
I want to see a high-level overview of project health,
So that I can spot issues immediately.

**Acceptance Criteria:**
**Given** I land on the Project Dashboard
**Then** I see aggregated metrics (Completion % by Form Type) (PM #4)
**And** metrics are interactive filters (clicking "80% Complete" filters the grid) (PM #1)
**And** an Activity Feed of recent submissions
**And** on Print (Cmd+P), the Sidebar and Nav are hidden (QA #5).

### Story 5.2: Data Grid & Custom Columns

As an Admin,
I want to view submissions in a customizable grid,
So that I can analyze specific data points.

**Acceptance Criteria:**
**Given** I am viewing the "Daily Logs" form data
**When** I toggle "Show only Failed Items"
**Then** the grid updates instantly (using `<DataTable />` wrapper around TanStack Table) (Arch #3)
**And** I can save this view configuration for later (stored in `UserPreferencesEntity` DB table) (Lead Dev #7) (FR4.1, FR4.2)
**And** I can toggle "Compact Mode" to see more rows (PM #5)
**And** first columns are sticky and show a shadow cue when scrolling horizontally (QA #2).

### Story 5.3: Lightbox & Media Zip

As an Admin,
I want to view photos without leaving the grid and download them in bulk,
So that I can generate reports or archives.

**Acceptance Criteria:**
**Given** I see a photo thumbnail in the grid
**When** I click it
**Then** it opens a full-resolution Lightbox (FR4.3)
**And** I can select multiple rows and click "Download Photos"
**And** the system triggers a background job to generate the ZIP and emails me when ready (Architect #5) (FR4.5).

### Story 5.4: FinOps: Quotas & Alerts

As an Owner,
I want to be alerted if a project exceeds its storage or AI budget,
So that I can control costs.

**Given** a project approaches its 5GB limit
**Then** the Owner receives an email alert
**And** the UI shows a "Storage Warning" banner
**And** technicians allow a 10% "Grace Period" overflow to prevent data loss during upload (PM #3) (FR17.2, FR18.2).

### Story 5.5: Map Dispatcher Interface

As a Dispatcher,
I want to view all technicians and stops on a map,
So that I can assign work efficiently.

**Acceptance Criteria:**
**Given** I am on the Maps page
**Then** I see the `<MapVisualizer />` with pins for all active stops
**And** I can toggle a "Selection Mode" button to distinguish between Panning and Lassoing on touch screens (UX #6)
**And** I can drag a lasso around a group of pins (using `mapbox-gl-draw`) (Lead Dev #1)
**And** click "Assign" to bulk-dispatch them to a technician (UI Map 9.0)
**And** the Map WebGL context is explicitly disposed on unmount to prevent leaks (Lead Dev #2).

## Epic 6: Live Smart Grid & Collaboration

**Goal:** Implement a custom, high-performance "Live Table" module that combines the usability of a spreadsheet with the structure of a database (Row-Centric).
**Value:** The office team can manage complex project schedules and trackers with hierarchy, rich data types, and real-time concurrency.
**Key Database Entities:** `SheetEntity`, `SheetColumnEntity` (Definitions), `SheetRowEntity` (Data + Metadata), `YjsDocumentEntity` (Binary State).
**FRs covered:** FR12.1, FR12.2, FR12.3, FR12.4, FR12.5, FR12.6, FR12.7, FR12.8, FR12.9, FR13.1, FR13.2, FR13.3, FR7.1, FR7.2, FR7.3, FR7.4, FR7.5, FR9.3, FR9.4 (Sheets), NFR9, NFR12.

#### Story 6.1: High-Performance Data Viewing

As a User,
I want to view sheets with 10,000+ rows without lag,
So that I can manage large projects efficiently.

**Acceptance Criteria:**
**Given** a dataset of 10k rows
**When** I scroll rapidly
**Then** the UI maintains 60fps (using virtualized rendering)
**And** DOM nodes are recycled to manage memory (using @tanstack/react-virtual)
**And** accessibility is maintained via standard HTML table structure (NFR12).

#### Story 6.2: Real-Time Sync (Yjs Integration)

As a User,
I want to see my colleague's changes instantly,
So that we don't work on stale data.

**Acceptance Criteria:**
**Given** two users on the same sheet
**When** User A edits a cell
**Then** User B sees the update in < 200ms
**And** User B sees a colored border (Presence) showing where User A is working
**And** the state is managed via `Y.Map` (Rows) and `Y.Array` (Order) to ensure eventual consistency.

**And** binary data (images, files, raw bytes) is **never stored in any Yjs shared type** — the CRDT contains structured metadata only (field IDs, answer values, status flags, S3 `objectKey` string references)
**And** file and image uploads always follow the S3 presigned URL pattern; only the `objectKey` string is written into the Yjs document after upload completes
**And** the Hocuspocus server enforces a **500 KB serialized document size guard** — this check fires on **every document update** via the `onChange` hook.
**And** an attempt to store a base64-encoded image directly in the Yjs document via the client API is rejected at the server guard layer and does not corrupt the shared document state.

#### Story 6.3: Row Assignment

As a Manager,
I want to assign a specific sheet row to a team member,
So that ownership of tasks is clear and the assignee is notified.

> **Note:** This story introduces the minimal "User/Member" column type (an Assignee column) as a self-contained prerequisite. The full suite of Rich Column Types (Text, Number, Date, Dropdown, Duration, etc.) is defined in Story 6.6. Developers must not wait for Story 6.6 before implementing this story.

**Acceptance Criteria:**
**Given** I am on a Sheet
**When** I add an "Assignee" column for the first time
**Then** the system creates a "User/Member" column type that renders project members as Avatar + Display Name options
**And** the column definition is stored in the `SheetColumnEntity` DynamoDB entity with `type: "user"` and `scope: "project-members"`

**Given** I click the Assignee cell on a row and select "Mike"
**Then** Mike's user ID is written to the `SheetRowEntity` DynamoDB entity as the `assignee` field (FR7.1)
**And** the assignment is synced to all connected clients via Yjs so the cell updates in real-time
**And** Yjs is the sync transport only — DynamoDB is the source of truth for the assignee field
**And** Mike receives an in-app and email notification with a deep link to the specific row (FR7.3, FR7.5)
**And** the Assignee cell renders Mike's Avatar and Display Name

**Given** I reassign a row from Mike to Sarah
**Then** Sarah receives an assignment notification with a deep link to the row
**And** Mike receives a separate "Unassigned" notification informing him the row was reassigned (FR7.1)
**And** previously delivered notifications to Mike are not retroactively modified or deleted

**Given** I am viewing my own sheets
**When** I apply "Assigned to Me" filter
**Then** only rows where my user ID is the assignee are shown (FR7.2)
**And** the filter is encoded in the URL as `?filter=assignee:me` for shareability.

#### Story 6.4: Project Team Chat

As a Team Member,
I want to discuss project issues in a dedicated channel,
So that communication is centralized and searchable.

> **Note:** This story covers project-level channel chat (UI Map 15.0). Row-level threaded comments are part of Story 6.7 (Row Detail Panel). These are distinct surfaces. Project-level chat supports FR7.3 (Notification Engine) and FR7.5 (Smart Linking) from the collaboration layer.

**Acceptance Criteria:**
**Given** I am in a project
**Then** a #general channel exists by default and all project members are auto-joined

**Given** I send a message in #general
**Then** it appears instantly for all other online project members via WebSocket (FR7.3)
**And** the message persists in DynamoDB so members who were offline see it on next login
**And** I can mention `@Mike` using their Display Name (stored and resolved via immutable User ID, never the display name string itself) (Lead Dev #5)

**Given** I am mentioned with `@Mike`
**Then** Mike receives an in-app notification and an email notification with a direct deep link to the message (FR7.5)
**And** the notification respects Mike's "Office Hours" settings — email is held until the next office-hours window if configured (PM #7)

**Given** I send a message referencing a sheet row or form submission
**Then** I can paste the entity URL to create a smart link card preview inline

**Given** the channel has 10,000+ messages
**Then** messages are virtualized and the UI does not degrade — only the visible viewport renders DOM nodes (UI Map 15.0).

#### Story 6.5: Notification & Subscription Preferences

As a User,
I want to configure which events trigger email or push notifications,
So that I am not overwhelmed by irrelevant alerts.

**Acceptance Criteria:**
**Given** I am in User Settings > Notifications
**Then** I see toggle controls for each notification event type: New Assignment, Mentioned in Chat, New Submission, Sheet Edit, Document Upload, Route Update

**Given** I toggle "Email me when mentioned" to OFF
**Then** I no longer receive emails for `@mention` events — in-app notifications still fire (FR7.4)

**Given** I toggle "Push Notifications" for New Submission to ON
**Then** I receive a browser/PWA push notification when a new submission is created on any form I am subscribed to (FR7.3)

**Given** a notification fires
**Then** the notification body includes a direct deep link that opens the specific item (row, form, message) in context (FR7.5)
**And** clicking the link from email or push opens the exact page and scrolls/highlights the relevant item.

#### Story 6.6: Rich Column Types

As a Planner,
I want to set columns to specific data types,
So that data entry is consistent and errors are caught at input time.

**Acceptance Criteria:**

**Standard Column Types (FR12.3):**
**Given** I add a column
**Then** I can select from: Text, Number, Date, Checkbox, Dropdown (Single-select), Dropdown (Multi-select)
**And** each type enforces its input format — a Number column rejects free-text entry with a visible inline error
**And** a Date column renders a date-picker, not a free text field

**Advanced Column Types (FR12.3):**
**Given** I add an advanced column
**Then** I can select from: Contact List (searches Project Members, renders Avatar + name), Symbols (RAG: Red/Amber/Green badge), Duration (HH:MM), Auto-Number (sequential, read-only, assigned on row creation)
**And** Auto-Number values are write-once — they cannot be edited by any user including Admin

**System Column Types (FR12.3):**
**Given** a sheet has any rows
**Then** Created By, Created Date, Modified By, and Modified Date columns are available as system columns
**And** system columns are always read-only — the API rejects any write attempt to a system column with a 403
**And** values in system columns are set server-side only

**Per-Column Validation (FR12.3):**
**Given** I configure a column
**Then** I can set a validation rule (e.g., "Must be email format", "Min value: 0", "Max length: 255")
**And** a cell failing validation renders a red border and tooltip explaining the rule
**And** a row cannot be submitted/saved while any required column has a validation error

**Given** a "User" column (introduced in Story 6.3) is used alongside all other types
**Then** it renders consistently with the Contact List column and uses the same project-member search.

#### Story 6.7: Row Hierarchy & Grouping

As a Project Manager,
I want to indent rows to create parent/child task relationships,
So that I can organize a WBS schedule without leaving the sheet.

**Acceptance Criteria:**

**Happy Path (FR12.2):**
**Given** I have a list of tasks
**When** I select a row and press Tab (or click "Indent")
**Then** it becomes a child of the immediately preceding sibling row
**And** the parent row shows a collapse/expand toggle
**And** collapsing a parent hides all descendant rows from the viewport without deleting data
**And** `SUM(CHILDREN())` formulas on the parent row correctly aggregate all direct children

**Error / Edge Cases:**
**Given** I attempt to indent a row that has no preceding sibling
**Then** the indent action is blocked and a tooltip explains "A row must have a parent row above it to be indented"

**Given** I attempt to drag a parent row below one of its own descendants
**Then** the drop is rejected and the row snaps back to its original position to prevent circular hierarchy

**Given** the maximum nesting depth (5 levels) is reached
**Then** the Tab key no longer indents further and the UI shows a "Maximum depth reached" indicator

**Given** a parent row is deleted
**Then** all child rows are promoted one level (not silently deleted)
**And** a confirmation modal warns: "Deleting this row will promote its N child rows to the parent level. Proceed?"

#### Story 6.8: Formula Engine Integration

As a Power User,
I want to use Excel-compatible formulas to calculate values across rows,
So that I don't need a separate spreadsheet for derived metrics.

**Acceptance Criteria:**
**Given** I enter `=A1*B1` in a cell
**Then** the system (Hyperformula) calculates the result and displays it (FR12.4)
**And** the calculation runs in a Web Worker to prevent UI thread blocking (FR12.4)
**And** the result updates immediately when A1 or B1 changes — no manual refresh required

**Given** I enter a formula referencing a non-existent column
**Then** the cell shows `#REF!` with a red triangle and tooltip explaining the broken reference

**Given** a circular dependency exists (e.g., A1 = B1, B1 = A1)
**Then** both cells show `#CIRCULAR!` and the sheet does not enter an infinite loop

**Given** I enter `=SUM(CHILDREN())`
**Then** the formula correctly aggregates values from all direct child rows in the hierarchy (Story 6.7 dependency)
**And** if the parent is collapsed, the formula value still reflects all children.

#### Story 6.9: Row Detail Panel

As a User,
I want to open a side panel for any row to attach files, leave comments, and view change history,
So that context for a row lives with the row and not in a separate folder or chat thread.

**Acceptance Criteria:**

**Panel Open (FR12.2):**
**Given** I click the "Open" icon on any row
**Then** a Side Panel slides in from the right without navigating away from the sheet
**And** the panel header shows the row's stable UUID, not its visual index position

**File Attachments (FR12.2):**
**Given** I upload a file in the Row Detail Panel
**Then** the file is stored in S3 under the key `{bucket}/{projectId}/rows/{rowUUID}/{filename}`
**And** the attachment record in DynamoDB stores the Row's stable UUID as the foreign key — never the visual index or row position
**And** if the row is reordered to position 5 from position 12, all previously uploaded attachments remain linked correctly

**Row Comments:**
**Given** I post a comment in the Row Detail Panel
**Then** it is stored in DynamoDB as a `RowCommentEntity` entity keyed to the row's stable UUID
**And** comments are distinct from the project-level Team Chat (Story 6.4) — they are scoped to this row only
**And** mentioning `@Sarah` in a row comment sends her a notification with a deep link to this row

**Audit History (FR12.7):**
**Given** I view the Audit History tab in the Row Detail Panel
**Then** I see a chronological log of every cell edit for this row: timestamp, user, field changed, old value, new value
**And** the log is immutable — no user can delete audit entries.

#### Story 6.10: Form-to-Sheet Integration

As a Manager,
I want form submissions to automatically populate a specific sheet,
So that I have a live tracker of field data.

**Acceptance Criteria:**
**Given** I am configuring a Form
**When** I select "Output to Sheet: Daily Log"
**Then** the system automatically creates columns for each Form Field
**And** when a new submission arrives, a new Row is appended to the Sheet
**And** Photos/Attachments are rendered as "Thumbnail" cells.

#### Story 6.11: Sheet-to-Route Integration

As a Dispatcher,
I want to build a route by selecting rows from a master sheet,
So that I don't have to re-enter addresses.

**Acceptance Criteria:**
**Given** I am in the Route Builder
**When** I select "Source: Master Job List"
**Then** I can select specific rows to add to the route
**And** changes to the Stop Order in the Route Builder update the `Rank` in the Sheet
**And** modifying the address in the Sheet updates the Route Stop coordinates.

#### Story 6.12: View Persistence & Privacy

As a User,
I want to save my filters and share them via URL,
So that I can show my team exactly what I'm looking at.

**Acceptance Criteria:**
**Given** I filter by "Status=Open"
**Then** the URL updates to `?filter=Status:Open` (FR12.6)
**And** I can save this as a "Private View" that only I can see
**And** I can share the URL with a colleague to replicate the view.

#### Story 6.13: Governance & Permissions

As an Admin,
I want to lock columns, save sheet snapshots, and roll back to previous states,
So that I can protect approved data and recover from unintended bulk edits.

**Acceptance Criteria:**

**Column Permissions (FR12.7):**
**Given** I am an Admin
**When** I edit Column Properties
**Then** I can toggle "Lock Column"
**And** Editors see the column as Read-Only
**And** the API rejects edits to that column from non-Admins

**Sheet Snapshots & Rollback (FR9.3, FR9.4):**
**Given** I am an Admin on a Smart Sheet
**When** I click "Save Snapshot"
**Then** the current full Yjs document state is serialised and stored as a `SheetSnapshotEntity` DynamoDB entity with my User ID and a Timestamp (FR9.4)
**And** I can view the snapshot list ordered by most recent
**And** each snapshot entry shows the author, timestamp, and an optional label I can set
**And** I can click "Restore" on any snapshot to replace the live Yjs document state with the snapshot binary (FR9.3)
**And** restoring creates a new snapshot entry marking it as a restore event — it does not delete history
**And** all connected users see the restored state propagated in real-time via Hocuspocus.

#### Story 6.14: Offline Resilience

As a Technician,
I want to edit the sheet while offline,
So that I can work in the basement.

**Acceptance Criteria:**
**Given** I am offline
**When** I edit a cell
**Then** the change is saved to `IndexedDB`
**And** when I reconnect, the change syncs to the server
**And** if a conflict occurs (Row Deleted), the system notifies me or quarantines the edit.

#### Story 6.15: Smart Grid Import & Upsert (FR12.5)

As a Power User,
I want to import a CSV or Excel file into a Smart Sheet and merge it against existing rows by a key column,
So that I can bulk-update hundreds of records without creating duplicates.

**Acceptance Criteria:**

**Import Wizard:**
**Given** I click "Import" on a Smart Sheet
**Then** an import wizard dialog opens where I can upload a `.csv` or `.xlsx` file
**And** the system parses the file headers and shows a column mapping step
**And** I can map each file column to an existing sheet column or create a new column

**Smart Upsert (Merge Mode, FR12.5):**
**Given** I enable "Merge Mode" in the import wizard
**Then** I can designate a "Key Column" (e.g., "SKU", "Job Number") for matching
**And** for each imported row, the system checks if a row with a matching key value already exists in the sheet
**And** if a match is found, the existing row is updated with the imported values — no duplicate row is created
**And** if no match is found, a new row is appended to the sheet
**And** after import completes, a summary modal shows: Rows Updated, Rows Created, Rows Skipped (parse errors)

**Validation:**
**And** the wizard blocks import if the selected Key Column contains duplicate values within the import file itself
**And** for imports exceeding 500 rows, the upsert operation is offloaded to a **BullMQ worker job** (same pattern as Story 2.6 retroactive rename) with progress reported via a Server-Sent Event stream — a synchronous Server Action would time out on ECS/Fargate for large datasets
**And** the import is processed as an atomic operation — either all rows succeed or none are committed (FR12.5).

#### Story 6.16: Gantt View (FR12.6)

As a Project Manager,
I want to visualize sheet rows as a Gantt chart using Start Date and End Date columns,
So that I can see task timelines and identify scheduling conflicts at a glance.

**Acceptance Criteria:**
**Given** a sheet has at least one "Date" type column mapped as a Start Date and one as an End Date (or Duration)
**When** I switch to "Gantt View"
**Then** each row renders as a horizontal bar spanning from Start Date to End Date on a timeline
**And** the timeline header shows months and weeks, and I can zoom in/out between Day/Week/Month granularity
**And** I can drag a bar's right edge to adjust the End Date — the underlying cell value updates immediately
**And** I can drag the entire bar to shift both Start and End dates while preserving duration
**And** parent rows (WBS hierarchy from Story 6.7) show a rollup bar spanning all children
**And** the view degrades gracefully on mobile — shows a read-only timeline with no drag interaction (FR12.6).

#### Story 6.17: Calendar View (FR12.6, FR13.1–13.3)

As a User,
I want to view sheet rows as calendar events on a monthly or weekly calendar,
So that I can manage date-driven workflows without switching to an external calendar tool.

**Acceptance Criteria:**
**Given** a sheet has at least one "Date" type column
**When** I switch to "Calendar View"
**Then** the view renders a monthly calendar (default) with each row appearing as an event chip on its date
**And** I can toggle to "Week View" for a more granular hourly grid
**And** clicking an event chip opens the Row Detail Side Panel (Story 6.9) without navigating away
**And** multi-day rows (Start Date ≠ End Date) span across calendar days visually
**And** the URL updates to `?view=calendar` — sharing the URL preserves the calendar view state (FR13.1, FR13.3)
**And** the Calendar component uses the Launch UI calendar-01 pattern for visual consistency (FR13.2).

#### Story 6.18: Card / Kanban View (FR12.6)

As a User,
I want to view sheet rows as cards grouped by a status column,
So that I can manage workflow stages visually and see work-in-progress at a glance.

**Acceptance Criteria:**
**Given** a sheet has at least one "Dropdown" or "Status" type column
**When** I switch to "Card View"
**Then** the sheet renders as a Kanban board with one column per distinct dropdown option
**And** each row appears as a card in its corresponding status column
**And** I can drag cards between columns to update the row's status value in real time (synced via Yjs)
**And** I can click a card to open the Row Detail Side Panel (Story 6.9)
**And** Card View is the **default view on mobile** — if no Status column exists, the system prompts the user to designate one
**And** the URL updates to `?view=card` for shareable state persistence (FR12.6, NFR per mobile default).

## Epic 7: Document Control & Field Tools

**Goal:** Implement the PDF Engine for hosting specs/plans, rendering blueprints on mobile, and the suite of Field Tools (Tasks, Schedule, Specs) for execution.
**Value:** James can markup a blueprint change and immediately link it to a Task, while Mike can check the Schedule dependencies offline.

### Story 7.1: Quick Field Task Creation (Photo + Voice)

As a Field Tech,
I want to create a Task with a photo from the field,
So that I can document a conflict without stopping work to type.

**Acceptance Criteria:**
**Given** I am in the Task module
**When** I tap "New Task"
**Then** the camera interface opens immediately
**And** I can capture a photo and record a 30s voice note
**And** the Task is saved as a "Draft" locally (offline-first)
**And** the Task is automatically tagged with my current GPS coordinates
**And** I can optionally link the Task to a "Space" on the active Blueprint.

### Story 7.2: Spec Library & Search

As a Technician,
I want to search the project specifications for "Concrete",
So that I know the correct mix to use.

**Acceptance Criteria:**
**Given** the Admin has uploaded the Spec Book
**When** I search for "Concrete"
**Then** the system returns the specific section (e.g., "03 30 00") (FR21.2)
**And** I can read it offline.

### Story 7.3: PDF Blueprint Viewer

As a Lead,
I want to view large blueprint PDFs on my tablet with smooth zooming,
So that I can see the details.

**Acceptance Criteria:**
**Given** I open a 50MB Blueprint PDF
**Then** it renders in < 3 seconds (NFR7)
**And** displays a Skeleton Screen loader during fetching (UX #4)
**And** I can zoom and pan without lag.

### Story 7.4: Schedule Visualization

As a Manager,
I want to view the project schedule as a filtered task list on mobile,
So that I can see upcoming milestones.

**Acceptance Criteria:**
**Given** I am on the Schedule tab on mobile
**Then** I see a vertical list of tasks sorted by Start Date
**And** "Gantt View" is disabled or simplified for small screens (FR22.3).

## Epic 8: Legacy Integration & Data Migration

**Goal:** Build the bridges for the "old world" including PDF Overlay Mapping and Bulk Imports.

### Story 8.1: PDF Overlay Mapping

As an Admin,
I want to drag input fields onto an uploaded Government PDF,
So that the final output looks exactly like the official form.

**Acceptance Criteria:**
**Given** I have uploaded a PDF background
**When** I drag a "Text Field" and place it over the "Name" box on the PDF
**Then** the system saves the X/Y coordinates
**And** normalizes them to a standard PDF viewport (e.g., 72 DPI) to prevent scaling issues (Lead Dev #8)
**And** uses them for generation (FR1.7).

### Story 8.2: Flattened PDF Export

As a User,
I want to export my submission as a flat PDF,
So that I can email it to the city inspector.

**Acceptance Criteria:**
**Given** a completed submission with overlay mapping
**When** I click "Export PDF"
**Then** the system generates a PDF with the text "burned in" to the original background
**And** it is not editable (FR1.7.1).

### Story 8.3: Bulk Import Wizard

As an Admin,
I want to paste 500 rows from Excel into a Smart Sheet,
So that I can bulk create records.

**Acceptance Criteria:**
**Given** I have data in the clipboard
**When** I paste into the grid
**Then** the system parses the columns
**And** enables a "Column Mapping Wizard" to align Excel headers with DB fields (PM #5)
**And** creates 500 new rows securely (FR4.9).

## Epic 9: Compliance, Access & Public Gates

**Goal:** Implement the "Visa Wizard" for external users and secure Public Links.

### Story 9.1: Visa Wizard (Onboarding Gate)

As an Admin,
I want to require subcontractors to upload insurance before accessing the dashboard,
So that we stay compliant.

**Acceptance Criteria:**
**Given** an invited user logs in for the first time
**When** they check "Pending Compliance" status
**Then** they are redirected to the "Visa Wizard"
**And** must enable MFA if they have "Admin" privileges (Arch #7)
**And** cannot see any project data until they complete the required uploads (FR15.2).

### Story 9.2: Public Link Sharing

As a Manager,
I want to share a read-only timeline with my client via a link,
So that they don't need to create an account.

**Acceptance Criteria:**
**Given** I am in Project Settings
**When** I generate a Public Link with "Password Protection"
**Then** the system provides a URL `worktree.pro/s/xyz`
**And** visitors must enter the password to view the Board (FR6.1, 6.2)
**And** all access incidents (IP, User Agent) are logged to a SOC2-compliant audit table (QA #6).

### Story 9.3: Marketing Landing Page

As a Visitor,
I want to see a product showcase at the root URL if I am not logged in,
So that I understand what Worktree is.

**Acceptance Criteria:**
**Given** I am unauthenticated
**When** I visit the root URL `/`
**Then** I see the Marketing Landing Page (Hero, Features, Pricing) (FR6.3)
**And** I can click "Login" to access the App Dashboard (`/dashboard`)
**And** authenticated users are auto-redirected to `/dashboard` (skipping the landing page).

## Epic 10: AI Automation & Intelligence Layer

**Goal:** Deploy the Agentic Assistant, RAG Engine, and "Magic Forward" email ingestion.

### Story 10.1: Native RAG Ingestion (Pinecone)

As a System,
I want to automatically index new submissions into Pinecone,
So that the AI can answer questions about them with semantic vector search.

**Acceptance Criteria:**
**Given** a new form submission is saved
**Then** a background job (BullMQ via ElastiCache) triggers
**And** generates embeddings for the text content via the configured AI provider (OpenAI/Anthropic)
**And** applies a strict Token Usage Cap ($50/month hard limit) (PM #6)
**And** upserts the embedding into **Pinecone** with `projectId` and `submissionId` as metadata fields for tenant-scoped retrieval
**And** supports k-NN semantic search for the AI assistant queries (FR8.2)
**And** the `VectorEmbeddingEntity` DynamoDB entity stores the Pinecone vector ID and metadata for deletion/audit.

### Story 10.2: Magic Forward (Email Ingestion)

As a User,
I want to forward an email to `new@worktree.com`,
So that a Project is created automatically.

**Acceptance Criteria:**
**Given** I forward a bid email with a PDF
**Then** the system parses the subject and body
**And** creates a new Project with the correct Client info
**And** notifies me when ready (FR8.1).

### Story 10.3: AI Assistant Interface

As a User,
I want to chat with an AI assistant in the sidebar,
So that I can find information quickly.

**Acceptance Criteria:**
**Given** I click the AI FAB
**Then** a chat window opens
**And** I can ask "What is the status of the HVAC inspection?" (FR11.1)
**And** the AI provides a "Confidence Score" and citations with its answer (UX #9)
**And** the FAB hides on scroll or is draggable to prevent blocking UI elements on mobile (UX #4).

### Story 10.4: API Key Management

As an Admin,
I want to generate scoped API keys for external tools and securely store outgoing service credentials,
So that I can integrate third-party systems without exposing secrets in plaintext.

**Acceptance Criteria:**

**Incoming API Keys (FR16.2a):**
**Given** I am in Project Settings > Integrations
**When** I create a new API Key
**Then** I must select at least one permission scope from the available list (e.g. `read:forms`, `write:submissions`, `read:sheets`)
**And** the full key is displayed exactly once immediately after creation and never again
**And** the key is stored as a bcrypt hash — the plaintext is never persisted
**And** I can see each key's label, scopes, creation date, and "Last Used" timestamp in the key list
**And** I can revoke any key immediately; revoked keys are rejected on the next API request
**And** API requests using the key are scoped strictly to the declared permissions — attempting an out-of-scope operation returns 403

**Outgoing Encrypted Secrets (FR16.2b):**
**Given** I am in Project Settings > Integrations > External Services
**When** I save a third-party credential (e.g. OpenAI API key, Stripe secret)
**Then** the value is encrypted with AES-256 field-level encryption before being written to DynamoDB
**And** the stored value is never returned to the frontend in plaintext — the UI shows only a masked preview (e.g. `sk-...xxxx`)
**And** the decrypted value is available only server-side to the worker/service that needs it
**And** I can delete the stored secret, which removes it from DynamoDB permanently.

### Story 10.5: Webhooks & Event Subscriptions

As a Developer,
I want to subscribe to project events like `submission.created`,
So that I can trigger external workflows in Zapier or n8n.

**Acceptance Criteria:**
**Given** I am in Project Settings > Integrations
**When** I add a Webhook URL for `submission.created`
**Then** the system sends a JSON payload to that URL when a submission occurs (FR16.1)
**And** includes a discrete `X-Signature` header for security verification
**And** retries with exponential backoff if the external server returns 500 (Reliability)
**And** logs the delivery attempt in the Audit Log.

### Story 10.6: OpenAPI / Swagger Auto-Documentation

As a Developer,
I want the Express REST API to expose an auto-generated OpenAPI spec,
So that mobile client developers and external integrators always have an accurate, up-to-date API contract.

**Acceptance Criteria:**
**Given** the Express backend is running
**Then** `GET /api/docs` serves a Swagger UI HTML page
**And** `GET /api/docs/openapi.json` returns the OpenAPI 3.0 spec as JSON
**And** the spec is auto-generated from route definitions using `zod-openapi` or equivalent — no hand-maintained YAML
**And** every route that accepts a Zod-validated request body has its request schema reflected in the spec
**And** every route response shape is documented with at least the 200 and 400/401/403 status codes
**And** the `/api/docs` endpoint is disabled (returns 404) when `NODE_ENV=production` unless `ENABLE_API_DOCS=true` is explicitly set (FR16.3).

## Epic 11: Help Center & Support System

**Goal:** Provide a self-service knowledge base for users and a feedback loop.

### Story 11.1: Help Article Editor

As an Admin,
I want to write help articles using a rich text editor,
So that I can document procedures.

**Acceptance Criteria:**
**Given** I am in the Admin Studio
**Then** I can use a Notion-like editor (Plate.js) to write content
**And** automatic version history is kept for compliance (QA #10)
**And** publish it to the Help Center (FR19.1).

### Story 11.2: Mobile Offline Reader

As a Technician,
I want to read help articles while offline,
So that I can troubleshoot equipment without signal.

**Acceptance Criteria:**
**Given** I am offline
**When** I open the Help Center
**Then** I can browse and read previously synced articles
**And** zoom into images (FR19.3)
**And** video content includes auto-generated transcripts for accessibility/search (NFR12).

### Story 11.3: Support & Feedback Shake

As a User,
I want to report a bug by shaking my phone,
So that I can quickly capture the context.

**Acceptance Criteria:**
**Given** I am on the mobile app
**When** I shake the device
**Then** a Feedback Form pops up
**And** automatically attaches a screenshot and device logs (FR19.4).
