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
- **Intelligence**: RAG Engine (pgvector) for context-aware queries and active Blueprint annotation.
- **Security**: Strict RBAC with "Project Visa" (Gated Access) for subcontractors.

**Non-Functional Requirements:**

- **Deployment**: Single-Server Self-Hosted (Docker/Coolify) with high density resource usage.
- **Performance**: <100ms API latency, <5% battery drain for geofencing, sub-2s offline startup.
- **Reliability**: Sync resilience for long-running uploads and schema migration strategies.
- **Data Isolation**: Postgres RLS enforcing strict multi-tenancy within a single database.

**Scale & Complexity:**

- **Primary Domain**: Full-Stack (Web + Mobile + Backend + AI).
- **Complexity Level**: **High**. Combining Offline Sync, Geofencing, Real-time Sockets, and RAG in a self-hosted monolith is architecturally demanding.
- **Estimated Components**: ~15 (Auth, Projects, Forms, Submissions, Routes, Chat, Files, AI, Email, Geofence, Notifications, Analytics, etc.).

### Technical Constraints & Dependencies

- **Strict Self-Hosting**: Must run on standard Linux VPS without proprietary cloud services.
- **Mobile Native Bridge**: Capacitor required for "Background-to-Foreground" handoff.
- **System Density**: Full stack must fit in <4GB RAM.
- **Schema Evolution**: Backend must support multiple schema versions for offline clients.

### Cross-Cutting Concerns Identified

- **Synchronization Engine**: The "Append-Only Ledger" pattern for all write operations.
- **Multi-Tenancy (RLS)**: Query scoping via `project_id`.
- **Real-Time Event Bus**: Redis-based bus for Chat/Notifications/Jobs.

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack Web Application** (Next.js 14 App Router + Postgres)

### Starter Options Considered

1.  **Create T3 App** (`create-t3-app`)
    - _Pros_: Industry standard for type-safety (tRPC/Next.js/Prisma/Tailwind). Extremely modular, no "SaaS bloat" (Stripe/Subscription code) to delete. Perfect for self-hosting.
    - _Cons_: Requires manual setup of the "Modular Monolith" folder structure (it defaults to standard Next.js layout).

2.  **Next.js Enterprise Boilerplate**
    - _Pros_: Comes with strict linting, testing (Jest/Playwright) and Storybook pre-configured.
    - _Cons_: Often engineered for Vercel deployment; might require "ejecting" some serverless patterns for our Docker/Coolify setup.

3.  **SaaS Starter Kits (Various)**
    - _Pros_: Pre-built Auth/Billing.
    - _Cons_: Too opinionated on Multi-tenancy (often Subdomain-based) which conflicts with our "Project-Centric" RLS model.

### Selected Starter: Create T3 App

**Rationale for Selection:**
We need a **"Clean Slate with Superpowers."** Worktree's architecture (Project-Centric, Offline-Sync, RLS) is unique. Using a pre-built SaaS kit would require deleting 50% of the code (Billing, Team Management) to replace it with our custom logic. `create-t3-app` gives us the best tools (Type Safety, DB connection) without the baggage.

**Initialization Command:**

```bash
npm create t3-app@latest ./Worktree -- --no-trpc --tailwind --prisma --nextAuth --appRouter --dbProvider postgres
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**

- **TypeScript**: Strict mode enabled by default (Crucial for our complex data model).

**Styling Solution:**

- **Tailwind CSS**: Utility-first, standard for modern React pipelines.

**Build Tooling:**

- **Next.js 14**: App Router for nested layouts (perfect for `Dashboard -> Project -> Form`).

**Testing Framework:**

- _Not included by default_ - We will manually add **Playwright** as per our Research.

**Code Organization:**

- **Monorepo-Ready**: We will restructure the default `src` into `features/` (Modular Monolith) immediately after init.

**Development Experience:**

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

1.  **Database**: `npx prisma migrate dev`
2.  **Infrastructure**: `docker-compose up -d` (DB, Redis, MinIO)
3.  **App**: `npm run dev`

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- **ORM Selection**: Prisma (Standard, Type-safe).
- **API Pattern**: Hybrid (Server Actions for Web, REST for Mobile).
- **UI Library**: **shadcn/ui** (User Mandate).

### Data Architecture

- **Database**: PostgreSQL 16 (Verified Image: `postgres:16-alpine`).
- **ORM**: **Prisma** (Latest). Chosen for robust migration capabilities and type safety.
- **Multi-Tenancy**: **Row-Level Security (RLS)**.
  - _Pattern_: All tables include `project_id`. RLS Policies enforce `project_id = current_setting('app.current_project_id')`.
  - _Bypass_: Prisma Client extensions will handle session variable setting.

### Data Architecture (Prisma Schema - High Level)

**Core Entities**:

- `User`: Auth properties, Profile, `systemRoleId`.
- `Project`: Workspaces.
- `ProjectRoleDefinitions`: JSONB Definition of roles specific to a Project or Template.
- `ProjectMember`: Link table (`userId`, `projectId`, `assigned_role_name`).

**RBAC System (Site vs Project):**

1.  **Site Roles (Hardcoded):**
    - `OWNER`, `SITE_ADMIN`, `CREATOR` (Can create projects), `MEMBER`.
    - Stored in `User.system_role`.

2.  **Project Roles (Dynamic/Snapshot):**
    - **Structure:** Stored as JSONB in `Project` table: `roles: { "Foreman": ["SHEET_VIEW", "FORM_SUBMIT"] }`.
    - **Snapshot Logic:** Creating a project _copies_ the Template's role definitions into the new Project. Future template updates do **not** cascade.
    - **Constraint:** `SystemRoles` are global. `ProjectRoles` are scoped strictly to `project_id`.

3.  **Security Policies:**
    - **Self-Demotion:** `BEFORE UPDATE` Trigger on `ProjectMember` prevents removing the last `DIRECTOR` role from a project.
    - **Ghost Permissions:** RLS `check_visibility()` (Object Level) always runs _before_ Application Permission checks.
    - **Caching Strategy:** Permissions are embedded in the Auth Session. Updates require a Session Refresh (Next Login or explicit refresh).

**Compliance & Access:**

- `ComplianceRequirement`: Definition (Type: PROOF_OF_INSURANCE, WAIVER_SIGNATURE). Linked to `Project`.
- `ComplianceRecord`: User's submission for a requirement (Status: PENDING, APPROVED, REJECTED).
- `ExternalAccessRequest`: Logs attempts to access shared resources.
- `HelpArticle`: Knowledge Base Item (Fields: `title`, `content_json` (Plate), `status` (DRAFT/PUBLISHED), `category_id`).
- `HelpCategory`: Organizational Folder for Articles.

### New Core Entities (Phase 2)

- **Smart Grid System (Hybrid Sync)**:
  - **Infrastructure**: **Hocuspocus** (WebSocket Server) running as a separate microservice.
  - **Persistence Strategy**:
    - **Live**: In-memory Yjs binary.
    - **Durable**: **Webhook Provider** saves snapshot to Postgres `Sheet` table every 5 minutes or on session end.
    - **Querying**: `SheetRow` table mirrors the Yjs data for SQL-based reporting (Dashboard metrics).
  - `Sheet`: Container (`name`, `project_id`, `visibility_config`).
  - `SheetColumn`: Definitions (`type`: JSON, `options`: JSON).
  - `SheetRow`: Durable Entity (`id`: CUID, `parent_id` for hierarchy, `rank`).
  - `SheetVersion`: Full JSON snapshot for rollback.
  - **Concurrency**: Optimistic Locking on SQL save. Last-Write-Wins on Yjs cell edits.

- **Connected Systems (Integration Layer)**:
  - **Form-to-Sheet**:
    - `SheetColumn.source_field_id`: Maps a column to a specific Form Field ID.
    - `SheetRow.submission_id`: Links a row to its source submission (Source of Truth).
  - **Sheet-to-Route**:
    - `Route.source_sheet_id`: Defines the sheet driving this route.
    - `RouteStop.sheet_row_id`: Bi-directional link. Updating the stop updates the row.
    - `SheetRow.route_group_id`: Optional grouping ID to visualize which rows belong to which route.

- **RFI System**:
  - `RFI`: The core request (`status`, `question`, `due_date`, `assignee_id`).
  - `SpecSection`: Parsed text from PDF (`code`, `title`, `content_vector`).
  - `ScheduleTask`: Gantt activity (`start`, `end`, `dependencies[]`).
  - **`EntityLink` (Polymorphic)**: The glue table.
    - Fields: `rfi_id?`, `task_id?`, `spec_id?`, `sheet_region_id?`.
    - Constraint: `CHECK (num_nonnulls(rfi_id, task_id, spec_id) == 1)`.

### Granular Visibility & Permissions (Deep Dive)

**Requirement:** Project Admins must set visibility on _all_ folders, objects, and chats.

**Schema Strategy:**

- **Entity Mixin:** `Form`, `Sheet`, `Folder`, `ChatChannel` tables will all include a standard `VisibilityConfig` JSONB column.
- **Structure**:
  ```json
  {
    "mode": "PUBLIC" | "PRIVATE" | "ROLE_RESTRICTED",
    "allowedRoles": ["manager", "admin"],
    "allowedUsers": ["user_id_123"]
  }
  ```

**RLS Enforcement Strategy:**

- **Policy:** `CHECK (check_visibility(project_id, visibility_config, auth.uid()))`
- **Deep Links**: Direct URL access to a Private ID must return `403 Forbidden` (Enforced by RLS, not just UI).
- **Concurrency**: If User A revokes User B's access to a folder, and User B tries to write to it simultaneously, the write must be **Rejected** (Database Constraint).
- **Export Process**: The "Export to Zip" background job must run _as the requesting user_ (or impersonate via RLS policy) to ensure it **Strips Out** private files.

**Real-Time Security:**

- **Instant Revocation**: Role changes (e.g., Demotion) trigger a specific Socket.io event (`auth:force_refresh`).
- **Client Action**: The client app listens for `auth:force_refresh` and immediately re-validates the session or redirects to the Login screen if access is lost.

### API & Communication Patterns

- **Versioning Strategy (Universal History)**:
  - **Pattern**: **Mutation-Based Audit Log**.
  - **Implementation**:
    - **Forms**: Store JSON Schema versions in `FormVersions` table.
    - **Sheets/Routes**: Use the **Offline Sync Ledger** (Replicache pattern) as the source of truth. Every change is a "Mutation" stored in `replicache_client_view`. We can reconstruct any state by replaying mutations up to timestamp `T`.
    - **Fallback**: For non-sync entities, use a lightweight `_history` table pattern (via Triggers) if strict audit is required.

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
  - **Rendering**: **TanStack Table v8** (Headless) + **TanStack Virtual** (Virtualization).
  - **Math**: **Hyperformula** (Headless Formula Engine).
- **Architecture**:
  - **Frontend**: Custom `SmartGrid` component. Connects to WebSocket via `y-websocket`.
  - **Backend**: Dedicated **Hocuspocus** (or custom Node/WS) server to manage active Yjs documents.
  - **Persistence**: Hybrid model.
    - Active State: Stored in Redis/Memory during editing.
    - Durability: Snapshotted to Postgres `Sheet` tables (Rows/Columns) periodically or on "Save".
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

- **Deployment**: **Docker Compose** (Single Node).
- **Orchestrator**: **Coolify**.
- **Container Strategy**: "All-in-One" Monolith Container (Next.js) + Microservices for specialized tasks (if needed later) + Persistence Containers (DB, Redis, MinIO).

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

**Redis Strategy:**

- **Persistence**: Used for Yjs Collaboration State (Smart Sheets).
- **Rate Limiting**: Used as the distributed counter store for the `rate-limiter-flexible` middleware (GLOBAL limits, not per-instance).
- **Job Queues**: BullMQ backing for Webhooks and IMAP Ingestion.
