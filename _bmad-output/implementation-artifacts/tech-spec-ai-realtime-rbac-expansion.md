---
title: "Global AI, Real-Time Sheets & RBAC Expansion"
slug: "ai-realtime-rbac-expansion"
created: "2026-01-08"
status: "ready-for-dev"
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - "Frontend: Next.js 14 (App Router)"
  - "Backend: AWS DynamoDB + ElectroDB"
  - "AI: Pinecone + Vercel AI SDK (Gemini)"
  - "Real-Time: Hocuspocus + Yjs + TanStack Table"
  - "PDF: pdf-lib (Backend)"
  - "Persistence: AWS ElastiCache for Redis 7 (BullMQ)"
files_to_modify:
  - "apps/backend/src/entities/**"
  - "apps/backend/src/middleware/rbac.ts"
  - "apps/frontend/features/ai-assistant/tools.ts"
  - "docker-compose.yml"
code_patterns:
  - "ElectroDB Entities (Single-table design)"
  - "RBAC Middleware (requireProjectAccess)"
  - "Hocuspocus Provier (Real-time sync)"
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

Implement a comprehensive set of "Enterprise" features: a Global Agentic AI (Gemini) with Pinecone-backed RAG; a Real-Time Spreadsheet engine (TanStack Table + Hocuspocus) for sub-second collaboration; a PDF Form Builder with "Burn-in" capability; and a Two-Tier RBAC system with `requireProjectAccess` middleware.

### Scope

**In Scope:**

- **Global AI Assistant**: Vercel AI SDK integration with Google Gemini + Pinecone.
- **Real-Time Sheets**: TanStack Table components backed by Hocuspocus and Yjs.
- **PDF Engine**: `pdf-lib` for backend generation.
- **Two-Tier RBAC**: Database migration for System vs. Project roles. Admin UI for role management.
- **Compliance Gates**: Express Middleware interception for external users and a verification wizard.
- **Enterprise Features**: Webhooks, Data Retention, Project JSON Export, Storage Quotas.

**Out of Scope:**

- Mobile App offline sync implementation for _these specific new features_ (Phase 4).
- AI Model Fine-tuning (Start with RAG/Prompting only).

## Context for Development

### Codebase Patterns

- **Modular Monolith**: App Router features talk to DynamoDB via ElectroDB.
- **Auth**: Auth.js v5.
- **Project Scope**: All entities prefixed with `PROJECT#<projectId>` in DynamoDB.
- **API Definition**: `apps/frontend/lib/api.ts` contains the client-side definition of endpoints.

### Files to Reference

| File                                  | Purpose                     |
| ------------------------------------- | --------------------------- |
| `apps/backend/src/entities/`          | DynamoDB Schema (ElectroDB) |
| `apps/backend/src/middleware/rbac.ts` | Access Control Middleware   |
| `apps/backend/src/index.ts`           | Backend Entry Point         |

### Technical Decisions

- **AI Tools**: `createAiTool` factory wraps `apiRequest`.
  - **Auth Constraint**: The AI must receive the user's JWT from the client session and explicitly forward it in the `Authorization` header.
  - **Safety**: "List" tools must enforce Hard Pagination (Limit: 50).
- **Hocuspocus Server**: Deploy as a separate ECS service.
  - **Auth**: Auth.js session validation.
  - **Persistence**: Use **Redis** (ElastiCache).
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

- [ ] Task 1: Update ElectroDB Entities
  - File: `apps/backend/src/entities/`
  - Action: Add `Project`, `ProjectMember`, `ComplianceRequirement`, `ComplianceRecord`, `Webhook`.
  - Notes: Ensure PK follows `PROJECT#<id>` pattern.

- [ ] Task 2: Configure Redis & Hocuspocus
  - File: `docker-compose.yml`
  - Action: Add `redis` service. Configure `hocuspocus` middleware for Auth.js.

#### 2. Backend Core (Express)

- [ ] Task 3: Implement `requireProjectAccess` Middleware
  - File: `apps/backend/src/middleware/rbac.ts`
  - Action: Validate Project + Role via `ProjectMemberEntity`.

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
  - Action: Implement `TanStack Table` with `Hocuspocus`.

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

- `@tanstack/react-table`
- **Real-time Sync**: Standardize on `Hocuspocus` (using the Redis and Database extensions).
  - [ ] Task 1.1: Standardize `ws-server` to use Hocuspocus.
  - [ ] Task 1.2: Remove all `y-websocket` client providers.
        Ensure centralized state management and valid RBAC.
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
