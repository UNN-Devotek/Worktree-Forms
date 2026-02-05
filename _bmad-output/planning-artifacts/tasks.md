# Implementation Task Manifest

> [!NOTE]
> Derived from **[Epics & Stories](./epics.md)**.
> **Status:** Active
> **Last Updated:** 2026-01-22

## Epic 1: Project & Data Management

- [ ] **Task 1.1**: Implement `Project` CRUD with Slug generation.
- [ ] **Task 1.2**: Implement `ProjectMember` invitation flow (SendGrid).
- [ ] **Task 1.3**: Build `Folder` hierarchy system (Recursive SQL/Prisma).
- [ ] **Task 1.4**: Implement "Move File/Folder" logic with permission checks.
- [ ] **Task 1.5**: Create "Bulk Export" job (Zip generation).
- [ ] **Task 1.6**: Implement "Retroactive Renaming" background job (BullMQ).

## Epic 2: Core Form Engine (Builder & Runner)

- [ ] **Task 2.1**: Build Drag-and-Drop Form Builder UI (DndKit).
- [ ] **Task 2.2**: Implement JSON Schema validation logic (Zod).
- [ ] **Task 2.3**: Build Mobile Form Runner (Auto-save to IndexedDB).
- [ ] **Task 2.4**: Implement "Split View" PDF Overlay editor.
- [ ] **Task 2.5**: Create PDF Generation service (`pdf-lib`) for submissions.
- [ ] **Task 2.6**: Implement Form Versioning & Rollback UI.

## Epic 3: Field Operations (Mobile PWA)

- [ ] **Task 3.1**: Setup Service Worker for Offline Caching (Workbox).
- [ ] **Task 3.2**: Implement `RouteList` view with Geo-sorting.
- [ ] **Task 3.3**: Build "Contextual Compass" (Geofence detection logic).
- [ ] **Task 3.4**: Integrate Native Maps Deep-linking.
- [ ] **Task 3.5**: Optimize Touch Targets & High Contrast Mode.

## Epic 4: Sync Engine & Submission Lifecycle

- [ ] **Task 4.1**: Implement `Replicache` (or custom "Append-Only Ledger") client.
- [ ] **Task 4.2**: Build Backend Sync Endpoint (Batch Processing).
- [ ] **Task 4.3**: Implement Resumable Uploads for Images (Tus.io or Chunked).
- [ ] **Task 4.4**: Create "Sync Status" Global Indicator UI.
- [ ] **Task 4.5**: Implement Conflict Resolution Strategy (Last-Write-Wins).

## Epic 5: Map Visualization & Dispatch

- [ ] **Task 5.1**: Integrate MapLibre/Mapbox GL.
- [ ] **Task 5.2**: Render "Pins" from `RouteStop` and `FormSubmission` data.
- [ ] **Task 5.3**: Implement "Lasso Selection" tool.
- [ ] **Task 5.4**: Build "Bulk Dispatch" Action (Assign to User).
- [ ] **Task 5.5**: Implement Real-time Pin Updates (Socket.io/Pusher).

## Epic 6: Live Smart Grid & Collaboration

### Phase 0: Cleanup & Foundation
- [ ] **Task 6.0.1**: **NocoDB Removal**: Remove service from Docker Compose, prune volumes, and clean env vars.
- [ ] **Task 6.0.2**: **Schema Migration**: Update `Sheet` model (remove NocoDB fields) and add `SheetSnapshot` / `SheetVersion`.
- [ ] **Task 6.0.3**: **Backend Routes**: Implement `sheets.ts` router (Create, Get, List, Delete).

### Phase 1: Sheet Management UI
- [ ] **Task 6.1.1**: Build `SheetList` component with Metadata Table (Name, Created, Owner).
- [ ] **Task 6.1.2**: Implement "Create Sheet" Modal & API Integration.
- [ ] **Task 6.1.3**: Build `SheetShell` layout (Toolbar + Canvas Area).

### Phase 2: The Grid Engine (Hocuspocus + TanStack)
- [ ] **Task 6.2.1**: Set up `Hocuspocus` (or Yjs Websocket) Server.
- [ ] **Task 6.2.2**: Implement `TanStack Table` with Virtualization.
- [ ] **Task 6.2.3**: Connect Yjs `Y.Map` to Table Data (Real-time Sync).

### Phase 3: Advanced Features
- [ ] **Task 6.3.1**: Build "Column Manager" Dialog (Smartsheet-style).
- [ ] **Task 6.3.2**: Implement Drag-and-Drop (Rows & Columns).
- [ ] **Task 6.3.3**: Implement Row Indentation/Hierarchy Logic.
- [ ] **Task 6.3.4**: Integrate `Hyperformula` for Client-side Math.
- [ ] **Task 6.3.5**: Build "Row Detail" Side Panel (Chat/Files).
- [ ] **Task 6.3.6**: Implement Form-to-Sheet Webhook/Trigger (Append Row).
- [ ] **Task 6.3.7**: Implement Sheet-to-Route Bi-directional Sync.
- [ ] **Task 6.3.8**: Build "Smart Import Wizard" (Excel/CSV + Upsert Logic).
- [ ] **Task 6.3.9**: Implement Gantt & Calendar View Components.
- [ ] **Task 6.3.10**: Implement Sheet Versioning & Restore UI.
- [ ] **Task 6.3.11**: Integrate AI Tool definitions for Sheet Editing.
- [ ] **Task 6.3.12**: Implement View Persistence (URL Search Params).
- [ ] **Task 6.3.13**: Implement Offline Resilience (IndexedDB + Replay Queue).

## Epic 7: Document Control & Tools

- [ ] **Task 7.1**: Build PDF Blueprint Viewer (Canvas/PDF.js).
- [ ] **Task 7.2**: Implement Vector Search for Specs (pgvector).
- [ ] **Task 7.3**: Create RFI Creation Modal & Workflow.
- [ ] **Task 7.4**: Build "Schedule View" (Gantt/List toggle).

## Infrastructure & DevOps

- [ ] **Infra 1**: Configure Docker Compose for Production (Coolify).
- [ ] **Infra 2**: Set up MinIO Buckets & Policies.
- [ ] **Infra 3**: Configure BullMQ & Redis for Jobs.
- [ ] **Infra 4**: Set up CI/CD Pipeline (GitHub Actions).
