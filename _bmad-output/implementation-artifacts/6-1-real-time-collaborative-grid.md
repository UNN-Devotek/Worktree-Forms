# Story 6.1: Real-Time Collaborative Grid

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Planner,
I want to edit the spreadsheet and see my colleagues' changes instantly,
so that we don't overwrite each other's work and collaborate effectively in real-time.

## Acceptance Criteria

1.  **Given** multiple users are viewing the same Sheet
    **When** User A types in Cell B2
    **Then** User B sees the change within 200ms (NFR9 - Real-time Performance)
2.  **Given** User A selects a cell
    **Then** User B sees User A's cursor/highlight box with their name/color (FR12.1, 12.2)
3.  **Given** an offline/race condition occurs
    **Then** the "Last Write Wins" policy is enforced (QA #1)
4.  **Given** active collaboration is happening
    **Then** the state is snapshot to Postgres every 5 minutes for durability (Arch #1)
5.  **Given** I am on a mobile device
    **Then** the grid is viewable (though likely read-only or card-view optimized in future, for now core grid rendering is required)

## Tasks / Subtasks

- [ ] 1. Scaffold Smart Sheet Feature Module
  - [ ] 1.1 Create `src/features/sheets` directory structure (components, server, store)
  - [ ] 1.2 Install dependencies: `yjs`, `@fortune-sheet/react`, `y-websocket` (check compatibility with React 18/Next.js 14)
  - [ ] 1.3 Setup Docker Service for Y-Websocket (or integrate into Node backend) - _Decision: Use custom Node server for WS_

- [ ] 2. Implement Backend Websocket Server
  - [ ] 2.1 Create `apps/backend` (or use existing) entry point for `y-websocket`
  - [ ] 2.2 Configure Redis persistence for Yjs documents
  - [ ] 2.3 Implement Authentication check on WS connection (validate Session Token)

- [ ] 3. Create Sheet UI Component
  - [ ] 3.1 Create `SheetEditor.tsx` wrapping FortuneSheet
  - [ ] 3.2 Implement Yjs Provider connection logic in `useSheetSync.ts` hook
  - [ ] 3.3 Verify "Offline Mode" handling (graceful degradation or local buffer)

- [ ] 4. Implement Data Persistence Strategy
  - [ ] 4.1 Create `Sheet` and `SheetSnapshot` Prisma models
  - [ ] 4.2 Create "Snapshot Worker" (Cron/Interval) to flush Redis state to Postgres
  - [ ] 4.3 Implement API to load initial state from Postgres -> Redis if not hot

- [ ] 5. Integration & verification
  - [ ] 5.1 Verify multi-user sync (Simulate 2 browser windows)
  - [ ] 5.2 Verify persistence (Restart container, data remains)
  - [ ] 5.3 Verify Auth (Unauthenticated user cannot connect)

## Dev Notes

### Architecture & Tech Stack

- **Frontend**: `@fortune-sheet/react` (Canvas based, high performance).
- **State**: `Yjs` (CRDT) for conflict resolution.
- **Transport**: Websockets (`y-websocket`) via a separate Node.js service (or custom route if Next.js supports WS reliably - _Use separate Node process in Docker for stability_).
- **Persistence**: Redis (Hot State) + Postgres (Cold Storage/Snapshots).

### Project Structure Notes

- Module: `src/features/sheets/`
- Components: `src/features/sheets/components/SheetEditor.tsx`
- Server: `apps/backend/src/ws-server.ts` (Need to ensure backend container is set up for this)

### References

- [Architecture.md -> Real-Time Collaboration Engine]
- [Epics.md -> Story 6.1]

## Dev Agent Record

### Agent Model Used

Antigravity (simulating create-story workflow)

### Debug Log References

### Completion Notes List

### File List
