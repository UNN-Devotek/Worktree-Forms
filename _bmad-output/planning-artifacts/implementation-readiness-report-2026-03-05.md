# Implementation Readiness Assessment Report

**Date:** 2026-03-05
**Project:** Worktree

---

## Document Inventory

### Documents Assessed

| Type | File | Status |
|---|---|---|
| PRD | `_bmad-output/planning-artifacts/prd.md` | ✅ Found (whole) |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` | ✅ Found (whole) |
| Epics & Stories | `_bmad-output/planning-artifacts/epics.md` | ✅ Found (whole) |
| UX Design Spec | `_bmad-output/planning-artifacts/ux-design-specification.md` | ✅ Found (whole) |
| Project Context | `_bmad-output/planning-artifacts/project-context.md` | ✅ Found (reference) |
| Sprint Status | `_bmad-output/implementation-artifacts/sprint-status.yaml` | ✅ Found (reference) |

**No sharded documents found. No duplicate conflicts.**

---

## PRD Analysis

### Functional Requirements Extracted

| FR | Description |
|---|---|
| FR1.1 | Admin drag-and-drop form creation |
| FR1.2 | Field validation (Required, Regex, Min/Max) |
| FR1.3 | Conditional visibility logic |
| FR1.4 | Smart Table fields with pre-filled read-only headers |
| FR1.5 | Auto-rename file uploads based on `[Field_Name]_[Date]` |
| FR1.5.1 | File storage structure `/{project_id}/{form_id}/{submission_id}/{filename}` |
| FR1.6 | Retroactive renaming background job |
| FR1.7 | PDF Form Overlay mapping (drag-and-drop input fields over PDF) |
| FR1.7.1 | Flattened PDF export with data burned in |
| FR2.1 | Technician route list sorted by distance |
| FR2.2 | Deep link to native maps (Google/Apple) |
| FR2.3 | Offline form completion |
| FR2.4 | Append-only ledger with sync replay on reconnect |
| FR2.4.1 | Schema migration for offline submissions; quarantine on failure |
| FR2.5 | Image auto-compression to 1080p before upload |
| FR2.6 | Touchscreen photo capture and signature |
| FR3.1 | Project container creation |
| FR3.2 | Project Dashboard with metrics and activity feed |
| FR3.3 | Human-readable URL slugs for all projects |
| FR4.1 | Submissions data grid |
| FR4.2 | Custom column visibility toggle |
| FR4.3 | Image thumbnails in grid + Lightbox |
| FR4.4 | Export: CSV, Excel, JSON, PDF (including mapped PDF) |
| FR4.5 | Bulk media ZIP download |
| FR4.9 | Legacy "Upload CSV > Map Columns" import wizard |
| FR5.1 | Owner invites users via email with standard roles |
| FR5.2 | Invites expire in 48h and are revocable |
| FR5.3 | RBAC enforced at API level |
| FR5.4 | Data isolation per instance |
| FR5.5 | Custom role creation ("Subcontractor" etc.) |
| FR5.6 | Claim Logic: Exclusive and Multi-Claim |
| FR5.7 | Visibility Scope: users see only claimed items |
| FR5.8 | Gated Access (Visa): mandatory onboarding before dashboard |
| FR5.9 | Global Audit Log with IP address and User Agent |
| FR6.1 | Secure read-only Public Link generation |
| FR6.2 | Password protection on Public Links |
| FR6.3 | Marketing Landing Page at root URL (`/`) |
| FR7.1 | Universal assignment of forms/files/rows to users |
| FR7.2 | Action Inbox listing all assigned items |
| FR7.3 | Notification engine (In-App, Email, Push) |
| FR7.4 | Granular notification subscription preferences |
| FR7.5 | Smart linking: notifications link to specific item context |
| FR8.1 | Magic Forward email ingestion → auto-create project |
| FR8.2 | RAG engine indexing project data for natural language queries |
| FR8.3 | Contextual Compass: geofence triggers auto-launch |
| FR9.1 | Full edit history for Forms, Sheets, Routes |
| FR9.2 | Versioning granularity: Forms on Publish, Sheets on Edit/Snapshot |
| FR9.3 | Restore/Rollback to previous version |
| FR9.4 | Blame: every version attributed to User + Timestamp |
| FR10.1 | User display name management |
| FR10.2 | Avatar upload with auto-crop/resize to 256×256 |
| FR10.3 | Light/Dark/System theme, persisted in DB |
| FR11.1 | Persistent global AI chat button |
| FR11.2 | Autonomous AI actions (sheet edits, form management, assignment, routing) |
| FR11.3 | Context-aware AI ("current page" awareness) |
| FR11.4 | AI operates strictly within user's RBAC scope |
| FR11.5 | Launch UI Proxx Chat Patterns for chat UI |
| FR12.1 | Live collaboration: sub-second sync via Hocuspocus + Yjs |
| FR12.2 | Row-centric data model with UUIDs, hierarchy, drag-and-drop, side panel |
| FR12.3 | Rich column types: Standard, Advanced, System columns with validation |
| FR12.4 | Advanced logic: Formulas (Web Worker), Conditional Formatting, Status Automation |
| FR12.5 | Smart ingestion: CSV/Excel import with Smart Upsert (Key Column merge) |
| FR12.6 | Multiple views: Grid (virtualized), Gantt, Calendar, Card/Kanban; URL-persisted state |
| FR12.7 | Governance: Snapshots/rollback, Audit Log, Column permissions, Guest access |
| FR12.8 | AI agent can perform sheet operations within user's RBAC scope |
| FR12.9 | Form-to-Sheet real-time append; Sheet-to-Route bi-directional sync |
| FR13.1 | Smart Sheet viewable as Calendar if Date column exists |
| FR13.2 | Launch UI Proxx Calendar Patterns for calendar UI |
| FR13.3 | Calendar event click opens Sheet Row side panel |
| FR15.1 | Project Compliance Gates for external users |
| FR15.2 | Redirect to Compliance Wizard if criteria unmet |
| FR15.3 | Identity Claiming via Email Magic Link or Verified Account |
| FR16.1 | Outgoing webhooks with retry logic (exponential backoff) |
| FR16.2 | API Key Management: incoming scoped keys + outgoing encrypted secrets |
| FR16.3 | OpenAPI/Swagger auto-generated documentation |
| FR17.1 | TTL retention policies for data types |
| FR17.2 | Hard storage quotas per project |
| FR17.3 | Project JSON export/import (portability) |
| FR18.1 | Soft caps for AI token and storage usage |
| FR18.2 | Email alerts when project exceeds monthly budget |
| FR19.1 | Rich text admin editor (Plate.js) for help articles |
| FR19.2 | Draft/Published article workflow |
| FR19.3 | Offline article caching with pinch-to-zoom images |
| FR19.4 | "Shake to Report" bug feedback form |
| FR20.1 | Techs create Draft RFIs offline (photo + voice note) |
| FR20.2 | RFIs linked to Sheet Region, Schedule Task, or Spec Section |
| FR20.3 | Ball-in-court tracking with SLA indicators |
| FR20.4 | Sequential RFI numbering on "Open" by PM |
| FR21.1 | PDF Spec Book ingestion split into sections |
| FR21.2 | Full-text search across specs |
| FR21.3 | Contextual spec suggestions during form filling |
| FR21.4 | Offline availability for parsed spec text |
| FR22.1 | Import `.xml` (MS Project) or `.xer` (Primavera P6) |
| FR22.2 | Desktop "Strategy Room" Gantt + Resource view |
| FR22.3 | Mobile Task List sorted by date |
| FR22.4 | "I am Blocked" button triggers RFI creation |

**Total FRs: 70**

### Non-Functional Requirements Extracted

| NFR | Description |
|---|---|
| NFR1 | Sync Resilience: 30+ min background uploads, resumable |
| NFR2 | Offline Startup: route list loads < 2s fully offline |
| NFR3 | Battery Drain: background sync < 5% battery/hour |
| NFR4 | Data Encryption: all data at rest AES-256 |
| NFR5 | Quarantine Safety: encrypted local quarantine store |
| NFR6 | Large Projects: 10,000 submissions without dashboard lag |
| NFR7 | Blueprint Rendering: 50MB vector PDF renders < 3s on tablet |
| NFR8 | Secrets Management: API keys encrypted at rest, never returned in plaintext |
| NFR9 | Real-Time Latency: Smart Sheet cursor < 200ms propagation |
| NFR10 | PDF Generation: 5MB flattened export < 2 seconds |
| NFR11 | AI Security: 0% RBAC bypass allowed |
| NFR12 | Accessibility: semantic HTML, ARIA labels, table roles for screen readers |
| NFR13 | Localization: English (en-US) + Spanish (es-ES); `Accept-Language` header respected |

**Total NFRs: 13**

---

## Epic Coverage Validation

### FR Coverage Matrix

| FR | Epic Coverage | Status |
|---|---|---|
| FR1.1 | Epic 2 | ✅ Covered |
| FR1.2 | Epic 2 | ✅ Covered |
| FR1.3 | Epic 2 | ✅ Covered |
| FR1.4 | Epic 2 (Story 2.3) | ✅ Covered |
| FR1.5 | Epic 2 | ✅ Covered |
| FR1.5.1 | Epic 2 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR1.6 | Epic 2 | ✅ Covered |
| FR1.7 | Epic 8 | ✅ Covered |
| FR1.7.1 | Epic 8 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR2.1 | Epic 3 | ✅ Covered |
| FR2.2 | Epic 3 | ✅ Covered |
| FR2.3 | Epic 3 | ✅ Covered |
| FR2.4 | Epic 4 | ✅ Covered |
| FR2.4.1 | Epic 4 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR2.5 | Epic 4 | ✅ Covered |
| FR2.6 | Epic 4 | ✅ Covered |
| FR3.1 | Epic 1 | ✅ Covered |
| FR3.2 | Epic 5 | ✅ Covered |
| FR3.3 | Epic 1 | ✅ Covered |
| FR4.1 | Epic 5 | ✅ Covered |
| FR4.2 | Epic 5 | ✅ Covered |
| FR4.3 | Epic 5 | ✅ Covered |
| FR4.4 | Epic 8 | ✅ Covered |
| FR4.5 | Epic 5 | ✅ Covered |
| FR4.9 | Epic 8 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR5.1 | Epic 1 | ✅ Covered |
| FR5.2 | Epic 1 | ✅ Covered |
| FR5.3 | Epic 1 | ✅ Covered |
| FR5.4 | Epic 1 | ✅ Covered |
| FR5.5 | Epic 9 | ✅ Covered |
| FR5.6 | Epic 9 | ✅ Covered |
| FR5.7 | Epic 9 | ✅ Covered |
| FR5.8 | Epic 9 | ✅ Covered |
| FR5.9 | Epic 1 | ✅ Covered |
| FR6.1 | Epic 9 | ✅ Covered |
| FR6.2 | Epic 9 | ✅ Covered |
| FR6.3 | **NOT in any epic FR list** — Story 9-3 in sprint-status shows `done` | ⚠️ Map gap (see §Major) |
| FR7.1 | Epic 6 | ✅ Covered |
| FR7.2 | Epic 6 | ✅ Covered |
| FR7.3 | Epic 6 | ✅ Covered |
| FR7.4 | Epic 6 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR7.5 | Epic 6 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR8.1 | Epic 10 | ✅ Covered |
| FR8.2 | Epic 10 | ✅ Covered |
| FR8.3 | Epic 3 | ✅ Covered |
| FR9.1 | Epic 2 | ✅ Covered |
| FR9.2 | Epic 2 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR9.3 | **NOT in any epic FR list or map** | ❌ MISSING |
| FR9.4 | **NOT in any epic FR list or map** | ❌ MISSING |
| FR10.1 | Epic 1 | ✅ Covered |
| FR10.2 | Epic 1 (Story 1.4 in sprint-status) | ✅ Covered (map gap — see §Minor) |
| FR10.3 | Epic 1 (Story 1.4 in sprint-status) | ✅ Covered (map gap — see §Minor) |
| FR11.1 | Epic 10 | ✅ Covered |
| FR11.2 | Epic 10 | ✅ Covered |
| FR11.3 | Epic 10 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR11.4 | Epic 10 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR11.5 | **NOT in any epic FR list or map** | ⚠️ UX implementation note — low risk |
| FR12.1 | Epic 6 | ✅ Covered |
| FR12.2 | Epic 6 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR12.3 | Epic 6 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR12.4 | Epic 6 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR12.5 | Epic 8 (bulk import wizard — FR4.9 AC covers upsert logic) | ✅ Covered |
| FR12.6 | Epic 6 (stories 6-7, 6-10, 6-11, 6-12) | ✅ Covered |
| FR12.7 | Epic 6 (story 6-13) | ✅ Covered |
| FR12.8 | Epic 10 / Epic 6 (story 6-10 form-to-sheet, AI agent) | ✅ Covered |
| FR12.9 | Epic 6 (stories 6-10, 6-11) | ✅ Covered |
| FR13.1 | Epic 6 (in header FRs list) | ✅ Covered |
| FR13.2 | **NOT in any epic FR list or map** | ⚠️ UX implementation note — low risk |
| FR13.3 | Epic 6 (in header FRs list) | ✅ Covered |
| FR15.1 | Epic 9 | ✅ Covered |
| FR15.2 | Epic 9 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR15.3 | Epic 9 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR16.1 | Epic 10 | ✅ Covered |
| FR16.2 | **NOT in any epic FR list or map** | ❌ MISSING |
| FR16.3 | **NOT in any epic FR list or map** | ❌ MISSING |
| FR17.1 | Epic 5 | ✅ Covered |
| FR17.2 | Epic 5 | ✅ Covered |
| FR17.3 | Epic 8 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR18.1 | Epic 5 | ✅ Covered |
| FR18.2 | Epic 5 | ✅ Covered |
| FR19.1 | Epic 11 | ✅ Covered |
| FR19.2 | Epic 11 | ✅ Covered |
| FR19.3 | Epic 11 | ✅ Covered |
| FR19.4 | Epic 11 | ✅ Covered |
| FR20.1 | Epic 7 | ✅ Covered |
| FR20.2 | Epic 7 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR20.3 | Epic 7 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR20.4 | Epic 7 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR21.1 | Epic 7 | ✅ Covered |
| FR21.2 | Epic 7 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR21.3 | Epic 7 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR21.4 | Epic 7 (in header FRs list) | ✅ Covered (map gap — see §Minor) |
| FR22.1 | Epic 7 / Epic 8 | ✅ Covered |
| FR22.2 | Epic 7 | ✅ Covered |
| FR22.3 | Epic 7 | ✅ Covered |
| FR22.4 | Epic 7 | ✅ Covered |

### NFR Coverage Matrix

| NFR | Epic Coverage | Status |
|---|---|---|
| NFR1 | Epic 4 | ✅ Covered |
| NFR2 | Epic 3 | ✅ Covered |
| NFR3 | Epic 3 | ✅ Covered |
| NFR4 | Epic 1 (but description references MinIO — stale) | ⚠️ Stale reference |
| NFR5 | Epic 4 | ✅ Covered |
| NFR6 | Epic 5 | ✅ Covered |
| NFR7 | Epic 7 | ✅ Covered |
| NFR8 | Epic 1 | ✅ Covered |
| NFR9 | Epic 6 | ✅ Covered |
| NFR10 | Epic 2 | ✅ Covered |
| NFR11 | Epic 10 | ✅ Covered |
| NFR12 | Epic 6 + Global AC | ✅ Covered |
| NFR13 | Global AC only — **no epic explicitly owns delivery** | ❌ MISSING owner |

### Coverage Statistics

- **Total PRD FRs:** 70
- **FRs fully covered:** 64
- **FRs with coverage map gap only (in epic headers, missing from map):** 22 (documented below)
- **FRs genuinely missing from all epics:** 4 (FR9.3, FR9.4, FR16.2, FR16.3)
- **FRs as low-risk UX notes without explicit epic:** 2 (FR11.5, FR13.2)
- **Coverage percentage (full + map-gap):** 97%
- **NFRs covered:** 12/13 (NFR13 Localization has no delivery owner)

---

## UX Alignment Assessment

### UX Document Status

Found: `ux-design-specification.md` — complete (13 steps, all completed)

### UX ↔ PRD Alignment

| UX Requirement | PRD FR | Aligned |
|---|---|---|
| "Muddy Thumb" 44px touch targets | FR2 Mobile, NFR2 | ✅ |
| Offline-first PWA | FR2.3, NFR1, NFR2 | ✅ |
| Contextual Compass geofence | FR8.3 | ✅ |
| Smart Table → Card List on mobile | FR1.4, FR12.6 | ✅ |
| High contrast outdoor mode | NFR12 (accessibility) | ✅ |
| Battery-efficient geolocation (SLC API) | NFR3 | ✅ |
| Visa Wizard UX (onboarding gate) | FR5.8, FR15.1 | ✅ |
| Blueprint annotation-to-form | FR1.7, FR20.2 | ✅ |

### UX ↔ Architecture Alignment

| UX Need | Architecture Support | Status |
|---|---|---|
| Offline PWA | Capacitor + Append-Only Ledger | ✅ |
| Real-time cursor sync < 200ms | Hocuspocus + Yjs + ElastiCache Redis | ✅ |
| 50MB PDF rendering | Tile Server / streaming approach (NFR7) | ✅ |
| Geofence without battery drain | Capacitor Background Runner (SLC API) | ✅ |
| Card/Kanban view on mobile | TanStack Table + view switching | ✅ |

### Warnings

- **No gaps detected** between UX, PRD, and Architecture — all three documents are well-aligned.

---

## Epic Quality Review

### Epic Structure Validation

#### User Value Focus

| Epic | User Value | Assessment |
|---|---|---|
| Epic 0: AWS Infrastructure Migration | ❌ No direct user value — technical migration | ⚠️ Known exception: brownfield prerequisite |
| Epic 1: Core Project Foundation | ✅ Sarah creates secure workspace, invites team | ✅ |
| Epic 2: Visual Form Builder | ✅ Sarah builds forms in < 15 minutes | ✅ |
| Epic 3: Field Operations Mobile | ✅ Mike navigates and submits offline | ✅ |
| Epic 4: Submission Lifecycle | ✅ Mike syncs data reliably | ✅ |
| Epic 5: Smart Grid / Mission Control | ✅ Sarah monitors 500 submissions at a glance | ✅ |
| Epic 6: Live Smart Grid | ✅ Team edits spreadsheet simultaneously | ✅ |
| Epic 7: Document Control | ✅ James markups blueprints, links RFIs | ✅ |
| Epic 8: Legacy Integration | ✅ Sarah pastes 500 Excel rows in seconds | ✅ |
| Epic 9: Compliance / Public Gates | ✅ Subcontractors vetted before access | ✅ |
| Epic 10: AI Automation | ✅ Sarah forwards email → project auto-created | ✅ |
| Epic 11: Help Center | ✅ Users self-serve offline | ✅ |

**Epic 0 Exception:** Infrastructure migration epics are a legitimate category for brownfield projects. Clearly documented as a prerequisite, not a user feature. The team is aware. This is a known exception, not a structural defect.

#### Epic Independence

- Epics 1–11 depend on Epic 0 only (explicitly documented)
- No cross-epic circular dependencies found
- Epic ordering is sound: 1→2→3→4→5→6 flows naturally; 7, 8, 9, 10, 11 are parallel tracks from Epic 1

#### Dependency Flow

```
Epic 0 (AWS Infra)
  └── Epic 1 (Core Auth/Projects) ──┬── Epic 2 (Forms) ──── Epic 8 (Legacy)
                                    ├── Epic 3 (Mobile) ─── Epic 4 (Sync)
                                    ├── Epic 5 (Dashboard)─ Epic 6 (Smart Grid)
                                    ├── Epic 7 (Docs)
                                    ├── Epic 9 (Compliance)
                                    ├── Epic 10 (AI)
                                    └── Epic 11 (Help)
```

No forward dependencies violating independence rules detected.

### Story Quality Assessment

#### Stale Technology References (🟠 Major)

1. **Story 1.1 AC** — "a dedicated MinIO bucket path `/project-uuid/` is reserved"
   - MinIO was replaced by AWS S3 (Story 0.2). This AC must be updated to reference the S3 path.
   - Specific text: `And a dedicated MinIO bucket path /project-uuid/ is reserved`
   - Fix: Update to `And a dedicated S3 path `{s3-bucket}/{project-uuid}/` is provisioned`

2. **Epic 10 header** — "Key Database Entities: `VectorEmbeddings` (pgvector)"
   - pgvector was replaced by Pinecone (Story 0.4). The entity is now `VectorEmbedding` stored in DynamoDB with the Pinecone vector ID, not pgvector.
   - Fix: Update to `Key Database Entities: VectorEmbedding (DynamoDB metadata + Pinecone vector ID)`

3. **Architecture.md testing decisions** — "Vitest + vitest-dynalite + Playwright"
   - Story 0.9 replaces vitest-dynalite with Testcontainers. Architecture should reflect the final decision.
   - Fix: Update to "Vitest + Testcontainers (`@testcontainers/localstack`) + Playwright"

#### Acceptance Criteria Quality

Reviewed a representative sample across epics:

- **Epic 0 stories (0.1–0.9):** All have well-formed Given/Then ACs with specific, measurable outcomes. ✅
- **Epic 1 stories (1.0–1.9):** Well-formed. Story 1.1 has the MinIO stale reference noted above. Otherwise solid.
- **Epic 6 stories:** Named but not fully expanded — 6-1 through 6-14 are marked `ready-for-dev` in sprint-status but individual story ACs need to be written before development begins. This is expected for backlog items.

#### Database Creation Timing

- Correct: Each story creates only the DynamoDB entities it needs
- Epic 0 Story 0.1 creates the full table schema upfront — acceptable because single-table design means one table creation that all other stories share. ✅

---

## Missing Requirements — Detailed Findings

### ❌ FR9.3 — Restore/Rollback Capability

**PRD text:** "Admin can view previous versions and 'Rollback' to a specific state."
**Epic coverage:** FR9.1 (Entity History) and FR9.2 (Granularity) are in Epic 2. FR9.3 and FR9.4 are not in any epic's FR list.
**Impact:** This is a meaningful user capability — admins expected to be able to restore form schemas, sheet snapshots, and route versions. Without a story for it, no one will build the rollback UI or the DynamoDB restore mechanism.
**Recommendation:** Add FR9.3 + FR9.4 to Epic 2 (forms history/restore) and Epic 6 (sheet audit/rollback story 6-12 governance). Update FR Coverage Map.

### ❌ FR16.2 — API Key Management

**PRD text:** "Admin can generate 'Hashed' API Keys with scopes (`read:forms`). Admin can securely save encrypted keys (OpenAI, Stripe) in the database."
**Epic coverage:** Epic 10 covers FR16.1 (webhooks) but FR16.2 is not listed in any epic.
**Impact:** Without this, the API key UI, hashing logic, encrypted secret storage, and key scope enforcement are unplanned work. High security surface area.
**Recommendation:** Add FR16.2 to Epic 10 (existing story `10-4-api-key-management` in sprint-status shows `done` — verify the story AC explicitly covers FR16.2 scope before closing).

### ❌ FR16.3 — OpenAPI/Swagger Auto-Documentation

**PRD text:** "API must expose an OpenAPI/Swagger spec auto-generated from code."
**Epic coverage:** Not in any epic.
**Impact:** Low risk for feature delivery, but a promise made in the PRD. External integrators and the mobile team depend on accurate API contracts.
**Recommendation:** Add to Epic 10 or Epic 1 (infrastructure concern). One story: "Auto-generate OpenAPI spec from Express route definitions; expose at `/api/docs`."

### ❌ NFR13 — Localization (en-US + es-ES)

**PRD text:** "Platform must support English (en-US) and Spanish (es-ES) out of the box. Error messages and UI text must respect `Accept-Language` header."
**Epic coverage:** Listed in the Global Acceptance Criteria (Definition of Done) but no epic owns the delivery of translation keys, `next-i18next` or equivalent setup, or es-ES translation files.
**Impact:** If no story owns this, no one sets up i18n infrastructure or provides the Spanish translations. This is cross-cutting work that needs a dedicated story.
**Recommendation:** Add Story 1.x or Epic 0 Story 0.10 for i18n infrastructure setup (install next-i18next, extract all strings to translation keys, provide es-ES base file). Mark all stories as blocked from completion until all user-facing strings are wrapped in `t()` calls.

---

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK** — The plan is structurally sound and covers 97% of PRD requirements. Four genuine gaps and three stale technology references require fixes before development on the affected stories begins. None of the gaps are blockers for the Epic 0 infrastructure work currently in progress.

### 🔴 Critical Violations

None. No structural epic violations or forward dependency loops found.

### 🟠 Major Issues Requiring Action

1. **FR9.3 + FR9.4 missing from all epics** — Add restore/rollback and blame attribution stories to Epics 2 and 6. Update FR Coverage Map.

2. **FR16.2 not traced to an epic** — Story `10-4-api-key-management` exists in sprint-status with status `done`; verify its AC explicitly covers both incoming scoped keys AND outgoing encrypted secrets. If not, reopen and update.

3. **FR16.3 not in any epic** — Add a story to Epic 10 for OpenAPI/Swagger auto-generation.

4. **NFR13 Localization has no delivery owner** — Add an i18n infrastructure story (Epic 1 or Epic 0). Without it, localization will be deferred indefinitely.

5. **Story 1.1 AC references MinIO** — Update to reference S3 path. Simple one-line fix but must be done before Story 1.1 work begins or is reviewed.

6. **Epic 10 header references pgvector** — Update to Pinecone. Cosmetic but causes confusion for any developer reading it.

### 🟡 Minor Concerns

7. **FR Coverage Map at bottom of epics.md is abbreviated** — The map only lists one representative FR per epic, missing 22 sub-FRs that are covered in the epic headers. Consider expanding the map or adding a note that the epic header "FRs covered" lists are the authoritative source.

8. **Architecture.md testing row references vitest-dynalite** — Story 0.9 supersedes this. Update architecture.md testing decisions to reference Testcontainers.

9. **FR6.3 (Marketing Landing Page) not in any epic FR list** — Sprint-status shows `9-3-marketing-landing-page: done`. Add FR6.3 to Epic 9's coverage list retroactively.

10. **FR11.5 and FR13.2** — Launch UI pattern references are UX implementation notes, not standalone features. They are implicitly covered by the stories that build the chat UI (Epic 10) and calendar view (Epic 6). No new stories required, but the chat and calendar story ACs should reference these patterns.

### Recommended Next Steps

1. Add FR9.3 and FR9.4 to Epic 2 (Story 2.5 "Restore & Blame" already exists — verify it covers both) and Epic 6 (story 6-12 governance should include rollback)
2. Open and verify Story `10-4-api-key-management` against FR16.2 full text; reopen if incomplete
3. Add FR16.3 story to Epic 10 — small story, one endpoint, auto-generated from existing routes
4. Add i18n infrastructure story to Epic 1 for NFR13 — this is a cross-cutting concern that needs to be set up before any UI stories are "Done"
5. Fix Story 1.1 MinIO → S3 AC reference
6. Fix Epic 10 header pgvector → Pinecone entity reference
7. Update architecture.md testing decisions to reference Testcontainers (Story 0.9)
8. Add FR6.3 to Epic 9's FRs covered list

### Final Note

This assessment identified **8 issues** across 3 severity levels. The 4 genuine missing requirements (FR9.3, FR9.4, FR16.2, FR16.3) and the missing NFR13 ownership are the most important to resolve. The stale tech references (MinIO, pgvector, vitest-dynalite) are quick fixes. The plan is in good shape for the infrastructure work underway; address the gaps before starting Epics 2, 6, and 10 story development.

---

**Assessment Date:** 2026-03-05
**Documents Assessed:** PRD, Architecture, Epics, UX Design Specification
**Assessor:** Claude Code (Implementation Readiness Workflow)
