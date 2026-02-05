# Story 3.2: Offline Mode

Status: done

## Story

As a Technician,
I want to fill out forms and view my route even with no signal,
So that I can keep working in remote areas.

## Acceptance Criteria

1.  **Given** I lose internet connectivity
    **Then** the app switches to "Offline Mode" (visual indicator).
2.  **Given** I submit a form while offline
    **Then** it is saved to the "Outbox" queue.
3.  **Given** connectivity is restored
    **Then** the queue automatically flushes to the server.

## Tasks

- [x] Setup `OfflineContext` and Network listener.
- [x] Implement `OfflineQueue` using LocalStorage/IndexedDB (via TanStack Query persistence).
- [x] Add Visual Indicator (Toast/Banner).
