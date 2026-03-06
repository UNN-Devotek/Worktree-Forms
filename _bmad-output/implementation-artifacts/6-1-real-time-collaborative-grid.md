# Story 6.1: Real-Time Collaborative Grid

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Planner,
I want to edit the spreadsheet and see my colleagues' changes instantly,
so that we don't overwrite each other's work and collaborate effectively in real-time.

## Acceptance Criteria

1.  **Given** multiple users are viewing the same Sheet
    **When** User A types in a cell
    **Then** User B sees the change within 200ms (Hocuspocus/Yjs transport)
2.  **Given** User A selects a cell
    **Then** User B sees User A's cursor/highlight box with their name/color (Awareness API)
3.  **Given** an offline/race condition occurs
    **Then** Yjs CRDT conflict resolution is enforced (LWW automatically handled)
4.  **Given** active collaboration is happening
    **Then** the document state is persisted to DynamoDB via Hocuspocus `Database` extension
5.  **Given** I am on a mobile device
    **Then** the TanStack Table renders responsively (pinned columns preserved)

## Tasks / Subtasks

- [ ] 1. Scaffold Smart Sheet Feature Module
  - [ ] 1.1 Create `apps/frontend/features/sheets` (components, server-actions, hooks)
  - [ ] 1.2 Install `yjs`, `@hocuspocus/server`, `@hocuspocus/transformer`, `@tanstack/react-table`
  - [ ] 1.3 Setup `ws-server` entry point for Hocuspocus

- [ ] 2. Implement Hocuspocus WebSocket Server
  - [ ] 2.1 Configure `apps/ws-server/src/index.ts` with Hocuspocus
  - [ ] 2.2 Implement `onAuthenticate` hook to validate Session Token
  - [ ] 2.3 Configure Redis (ElastiCache) extension for pub-sub across instances

- [ ] 3. Create Collaborative Table UI
  - [ ] 3.1 Create `SheetEditor.tsx` using `TanStack Table` (replacing Canvas-based FortuneSheet)
  - [ ] 3.2 Implement `useSheetCollaboration.ts` hook for Yjs binding
  - [ ] 3.3 Verify "Offline Mode" handling (Yjs IndexedDB provider for persistence)

- [ ] 4. Implement Data Persistence Strategy
  - [ ] 4.1 Create `SheetSnapshotEntity` in ElectroDB
  - [ ] 4.2 Implement Hocuspocus `Database` extension `store` method to flush binary Yjs updates to DynamoDB
  - [ ] 4.3 Implement `onLoadDocument` to hydrate from DynamoDB

- [ ] 5. Integration & Verification
  - [ ] 5.1 Verify multi-user sync (Simulate 2 browser windows)
  - [ ] 5.2 Verify persistence (Restart `ws-server`, data remains via DynamoDB)
  - [ ] 5.3 Verify Auth (Unauthenticated user cannot connect to WS)

## Dev Notes

### Architecture & Tech Stack

- **Frontend**: `TanStack Table` + `Yjs`.
- **State**: `Yjs` (CRDT) for conflict resolution.
- **Transport**: `Hocuspocus` (WebSocket frame manager).
- **Persistence**: ElastiCache (Hot Pub/Sub) + DynamoDB (Cold Storage/Snapshots).

### Project Structure Notes

- Module: `apps/frontend/features/sheets/`
- WS Server: `apps/ws-server/` (Service runs on port 1234)

### References

- [Architecture.md -> Real-Time Collaboration Engine]
- [Epics.md -> Story 6.1]

## Dev Agent Record

### Creation Date

2026-03-05 (Updated from 2026-01-20)

Antigravity (simulating create-story workflow)

### Debug Log References

### File List
