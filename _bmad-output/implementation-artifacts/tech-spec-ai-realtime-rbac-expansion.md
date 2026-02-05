---
title: "Global AI, Real-Time Sheets & RBAC Expansion"
slug: "ai-realtime-rbac-expansion"
created: "2026-01-08"
status: "ready-for-dev"
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - "Frontend: Next.js 14 (App Router)"
  - "Backend: Express.js + Prisma + PostgreSQL"
  - "AI: Vercel AI SDK (Gemini) wrapping Express API"
  - "Real-Time: Yjs (separate container) + FortuneSheet"
  - "PDF: pdf-lib (Backend) + react-pdf-highlighter (Frontend)"
  - "Persistence: Redis (for Yjs, Rate Limits, Queues)"
files_to_modify:
  - "apps/backend/prisma/schema.prisma"
  - "apps/backend/src/middleware/auth.ts"
  - "apps/frontend/features/ai-assistant/tools.ts"
  - "docker-compose.yml"
code_patterns:
  - "API Wrapper Proxy (AI Tools -> Express API)"
  - "Middleware Interceptor (Compliance in Express)"
  - "CRDT State Sync (Sheets via Yjs container)"
test_patterns:
  - "Unit Tests for Logic Engine"
  - "E2E Tests for Real-Time Sync"
---

# Tech-Spec: Global AI, Real-Time Sheets & RBAC Expansion

**Created:** 2026-01-08

## Overview

### Problem Statement

The current platform lacks real-time collaboration for data grids, forcing users to refresh for updates. It also lacks a unified interface for autonomous actions (AI) and has a rigid permission structure that doesn't support complex "Project vs Site" hierarchies or external compliance gating.

### Solution

Implement a comprehensive set of "Enterprise" features: a Global Agentic AI (Gemini) that wraps existing Express API endpoints; a Real-Time Spreadsheet engine (FortuneSheet + Yjs) for sub-second collaboration; a PDF Form Builder with "Burn-in" capability; and a Two-Tier RBAC system with External Compliance Gates.

### Scope

**In Scope:**

- **Global AI Assistant**: Vercel AI SDK integration with Google Gemini. Tools will wrap `lib/api.ts` calls to the Express Backend.
- **Real-Time Sheets**: FortuneSheet components backed by Yjs and a dedicated WebSocket service.
- **PDF Engine**: `pdf-lib` for backend generation (Auto-Layout for standard forms), `react-pdf-highlighter` for template mapping.
- **Two-Tier RBAC**: Database migration for System vs. Project roles. Admin UI for role management.
- **Compliance Gates**: Express Middleware interception for external users and a verification wizard.
- **Enterprise Features**: Webhooks, Data Retention, Project JSON Export, Storage Quotas.

**Out of Scope:**

- Mobile App offline sync implementation for _these specific new features_ (Phase 4).
- AI Model Fine-tuning (Start with RAG/Prompting only).

## Context for Development

### Codebase Patterns

- **Separated Architecture**: Frontend (Next.js) talks to Backend (Express) via REST API.
- **Auth**: JWT based. AI must forward user's JWT.
- **Missing Project Entity**: The schema currently lacks a `Project` table.
- **API Definition**: `apps/frontend/lib/api.ts` contains the client-side definition of endpoints.

### Files to Reference

| File                                  | Purpose                                 |
| ------------------------------------- | --------------------------------------- |
| `apps/backend/prisma/schema.prisma`   | DB Schema (needs RBAC + Project update) |
| `apps/frontend/lib/api.ts`            | Frontend API Client (AI Tool Source)    |
| `apps/backend/src/index.ts`           | Backend Entry Point                     |
| `apps/frontend/lib/conditional-logic` | Existing Form Logic (Client side)       |

### Technical Decisions

- **AI Tools**: `createAiTool` factory wraps `apiRequest`.
  - **Auth Constraint**: The AI must receive the user's JWT from the client session and explicitly forward it in the `Authorization` header.
  - **Safety**: "List" tools must enforce Hard Pagination (Limit: 50).
- **Yjs Server**: Deploy as a separate Docker service (`worktree-websocket`).
  - **Auth Constraint**: Must share `JWT_SECRET`. Implement **Sliding Sessions**.
  - **Persistence**: Use **Redis** adapter.
- **RBAC**: Implement "Two-Tier" (`SystemRole`, `ProjectRole`). Middleware validates `ProjectMember`.
- **Compliance**:
  - **Security**: Strict `multer` file filter (PDF/Images only).
  - **Retention**: Implement TTL Policy Engine for auto-deletion.
- **Migration Strategy**:
  - **Legacy Data**: `seed.ts` migrates root folders to "Default Project".
- **i18n**: use `Accept-Language` header. Support **English** and **Spanish**.

## Implementation Plan

### Tasks

#### 1. Database & Infrastructure

- [ ] Task 1: Update Prisma Schema
  - File: `apps/backend/prisma/schema.prisma`
  - Action: Add `Project`, `SystemRole`, `ProjectRole`, `ProjectMember`, `ComplianceRequirement`, `ComplianceRecord`, `IntegrationSecret` (Encrypted), `ApiKey` (Hashed), `Webhook`. Add indexes `@@index([projectId])`, `@@index([keyHash])`.
  - Notes: Include `seed.ts` for "Default Project" validation.

- [ ] Task 2: Configure Redis & WebSocket Service
  - File: `docker-compose.yml`, `apps/websocket-server/package.json`
  - Action: Add `redis` service. specific `worktree-websocket` service with `y-websocket` and Redis adapter.
  - Notes: Ensure `JWT_SECRET` is passed to the WS container.

#### 2. Backend Core (Express)

- [ ] Task 3: Implement RBAC Middleware
  - File: `apps/backend/src/middleware/auth.ts`
  - Action: Create `validateProjectAccess` middleware. Checks `ProjectMember` table. Implement `EncryptionService` (AES-256) for Secrets.
  - Notes: Handle 403 Forbidden with clear error messages.

- [ ] Task 4: Compliance & Upload Hygiene
  - File: `apps/backend/src/services/compliance.service.ts`
  - Action: Implement `checkGate`. Log `ComplianceFailure` to Audit. Implement `UploadService` quota check (max 5GB/project).
  - Notes: Use `multer` for strictly filtering upload types.

- [ ] Task 5: Webhooks & Email
  - File: `apps/backend/src/services/webhook.service.ts`
  - Action: Implement BullMQ worker for `submission:created` event. Implement `MailService` interface (SES/SendGrid) for Magic Links.
  - Notes: Add exponential backoff retry logic.

- [ ] Task 6: PDF Engine & i18n
  - File: `apps/backend/src/services/pdf.service.ts`
  - Action: Implement `PdfBurner` (existing PDF) and `AutoLayoutPdf` (standard form). Integrate `fontkit` with UTF-8 font.
  - Notes: Add `i18n` middleware to parse `Accept-Language`.

#### 3. Frontend Features

- [ ] Task 7: AI Assistant (Gemini)
  - File: `apps/frontend/features/ai-assistant/tools.ts`
  - Action: Wrap `lib/api.ts` endpoints. Implement `getSystemPrompt` with Lazy Context injection (Active Project Only).
  - Notes: Ensure Agent Courtesy check (Yjs presence) before editing.

- [ ] Task 8: Real-Time Sheets
  - File: `apps/frontend/features/sheets/SheetEditor.tsx`
  - Action: Implement `FortuneSheet` with `useYjs`. Add Mobile Detection for **Card View** fallback.
  - Notes: Lazy load this component (`ssr: false`).

- [ ] Task 9: Form Builder Hardening
  - File: `apps/frontend/lib/form-validation.ts`
  - Action: Implement `generateDynamicSchema` (memoized). Update Zod generation to respect `LoginState`.
  - Notes: Add Unit Tests for `engine.ts` (circular logic).

#### 4. Settings & Docs

- [ ] Task 10: API Keys & Auto-Docs
  - File: `apps/frontend/app/(dashboard)/settings/api/page.tsx`
  - Action: Build UI for generating Incoming Keys (show once) and Outgoing Secrets.
  - Notes: Implement `zod-to-openapi` in Backend build script.

### Acceptance Criteria

- [ ] AC 1: Given a user on Mobile, when they open a Sheet, then they see a Real-Time Card View (not a broken canvas).
- [ ] AC 2: Given an external dev with an Incoming API Key, when they hit the API, then they are rate-limited to their quota.
- [ ] AC 3: Given a Spanish user (`es-ES`), when they hit a validation error, then they see the message in Spanish.
- [ ] AC 4: Given a Form with logic hiding a Required field, when the field is hidden, then the form submits successfully (no validation error).
- [ ] AC 5: Given a Project Template, when imported, then it creates Project Roles but DOES NOT alter System Roles.
- [ ] AC 6: Given an AI Agent infinite loop, when it hits 10 req/min, then the API blocks it (429).

## Additional Context

### Dependencies

- `@fortune-sheet/react`
- `y-websocket`, `y-redis`
- `bullmq`
- `pdf-lib`, `fontkit`
- `zod-to-openapi`

### Testing Strategy

- **Unit**: Validation Logic, RBAC Middleware.
- **E2E**: Cypress test for Multi-Tab Real-Time Sync.
- **Manual**: Verify Screen Reader access to Sheet Shadow DOM.

### Notes

- **A11y**: The Shadow DOM for the Sheet is complex. Use `aria-live` regions for updates.
- **Cost**: Watch the Gemini token usage. The `UsageMonitor` email alert is critical for Day 1.
