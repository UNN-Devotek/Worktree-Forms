---
stepsCompleted: []
story_key: 6-2-real-time-sync-yjs-integration
status: done
tasks:
  - [x] Setup Hocuspocus server in backend
  - [x] Create useYjsStore hook on frontend
  - [x] Bind TanStack Table data to Y.Map
  - [x] Implement Presence (User Cursors)
  - [x] Verify sync between two browser windows
---

# Story 6.2: Real-Time Sync (Yjs Integration)

## Story
As a User,
I want to see my colleague's changes instantly,
So that we don't work on stale data.

## Acceptance Criteria
- [x] **Given** two users on the same sheet
- [x] **When** User A edits a cell
- [x] **Then** User B sees the update in < 200ms
- [x] **And** User B sees a colored border (Presence) showing where User A is working
- [x] **And** the state is managed via `Y.Map` (Rows) and `Y.Array` (Order) to ensure eventual consistency.

## Dev Notes
- **Backend:** `apps/backend/src/ws-server.ts`
- **Frontend:** `apps/frontend/features/sheets/stores/useYjsStore.ts`
- **Auth:** WebSocket connection MUST validate JWT from URL query param.
- **Persistence:** Use `hocuspocus-provider-webhook` to trigger saves to Postgres.
