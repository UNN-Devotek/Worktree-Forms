# Story 4.1: Background Sync & Queue

Status: ready-for-dev

## Story

As a Technician,
I want my offline data to automatically upload when I am back online,
So that I don't have to manually "Send" everything.

## Acceptance Criteria

1.  **Given** I have saved 5 forms while offline
2.  **When** I regain internet connection
3.  **Then** the background sync engine (RepliCache pattern) automatically uploads the data
4.  **And** I see a visible "Syncing..." spinner followed by "All Changes Saved" (UX #2)
5.  **And** Toast notifications are grouped/deduped (e.g. "Synced 50 items") to prevent spam (Arch #2)
6.  **And** Uploads continue in a "Global Context" even if I navigate away from the page (Lead Dev #4)
7.  **And** sync verification trusts the Server Timestamp to handle client clock drift (QA #5)
8.  **And** resolves any simple conflicts (Append-Only) (FR2.4).

## Tasks / Subtasks

- [ ] Task 1: Mutation Persistence Layer
  - [ ] Install `idb` (IndexedDB wrapper) if not present
  - [ ] Implement `MutationQueue` class to store offline mutations
  - [ ] Configure `PersistQueryClientProvider` to handle mutation recovery (or custom solution if TanStack persistence is query-only)
  <!-- Note: TanStack Query v5 has experimental mutation persistence, but robust queue often requires custom implementation or `offlineFirst` mode with careful handling. We will use a custom Queue + Service Worker or Global Provider approach. -->

- [ ] Task 2: Sync Engine Service
  - [ ] Create `features/sync/services/sync-engine.ts`
  - [ ] Implement `processQueue()` logic (FIFO)
  - [ ] Handle retry logic with exponential backoff
  - [ ] Implement `onOnline` trigger

- [ ] Task 3: Global Sync Provider & UI
  - [ ] Create `features/sync/components/sync-provider.tsx`
  - [ ] Render Global Spinner when `isSyncing`
  - [ ] Implement "Grouped Toast" logic (store successful syncs in a batch and toast once)
  - [ ] Integrate into `app/providers.tsx`

- [ ] Task 4: Integration with Form Runner
  - [ ] Update `FormRunner` to use `useSubmitSubmission` that delegates to `SyncEngine` when offline
  - [ ] Verify `localStorage` fallback from Story 3.5 is migrated to/replaced by this robust Queue

- [ ] Task 5: Verification
  - [ ] E2E Test: Go Offline -> Submit 3 forms -> Go Online -> Verify 3 mutations fire & 1 Toast appears
  - [ ] Unit Test: Queue serialization/deserialization

## Dev Notes

- **Architecture**: We are implementing a "Store & Forward" pattern.
- **Conflict Resolution**: For now, we assume Append-Only (server accepts all submissions).
- **RepliCache**: We are NOT using the `replicache` library (paid/complex), but implementing the _pattern_ as requested by the Project Context.
