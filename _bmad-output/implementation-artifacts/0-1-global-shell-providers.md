# Story 0.1: Global Shell & Providers

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to implement the root layout with all necessary context providers,
so that the app handles themes, sessions, and offline state correctly.

## Acceptance Criteria

1.  **Given** I load the application
2.  **Then** the `RootLayout` wraps children with `SessionProvider`, `ThemeProvider`, `QueryClientProvider`, `Toaster`, and `OfflineSyncProvider`
3.  **And** `OfflineSyncProvider` initializes _after_ `QueryClient` to prevent premature retries (Lead Dev #2)
4.  **And** the `OfflineIndicator` banner appears when network is disconnected (UI Map 1.1)
5.  **And** `ThemeProvider` suppresses hydration mismatch to prevent FOUC (Lead Dev #5)
6.  **And** navigation between main views uses subtle Fade/Slide transitions (UX #5).

## Tasks / Subtasks

- [x] Task 1: Core Providers Component (AC: 2, 3, 5)
  - [x] Create `apps/frontend/app/providers.tsx` (Client Component)
  - [x] Implement `ThemeProvider` (next-themes)
  - [x] Implement `SessionProvider` (next-auth/react)
  - [x] Implement `QueryClientProvider` (tanstack/react-query)
  - [x] Implement `Toaster` (sonner) mechanism

- [x] Task 2: Offline Infrastructure (AC: 3, 4)
  - [x] Create `apps/frontend/features/offline/context/offline-sync-provider.tsx`
  - [x] Create `apps/frontend/features/offline/components/offline-indicator.tsx`
  - [x] Implement network status detection (`navigator.onLine` + event listeners)
  - [x] Show `OfflineIndicator` (fixed banner or toast) when offline

- [x] Task 3: Root Layout Implementation (AC: 2, 6)
  - [x] Update `apps/frontend/app/layout.tsx` to use the new `<Providers>` component
  - [x] Apply global font (Inter/Geist) via `next/font`
  - [x] Add basic view transition styles (Tailwind/CSS)

## Dev Notes

### Architecture Patterns & Constraints

- **Client vs Server**: `layout.tsx` is a Server Component. `providers.tsx` must be a Client Component (`"use client"`).
- **Offline First**: The `OfflineSyncProvider` is critical. It must sit high in the tree to intercept/queue mutations.
- **Hydration**: `next-themes` often causes hydration errors. Use `suppressHydrationWarning` on the `<html>` tag in `layout.tsx`.

### Project Structure Notes

- **Providers**: Place in `app/providers.tsx` to keep root clean.
- **Offline Feature**: Logic lives in `features/offline/`.

### References

- [Source: epics.md#Story-0.1:-Global-Shell-&-Providers](file:///c:/Users/White/Documents/Worktree/Worktree/_bmad-output/planning-artifacts/epics.md#Story-0.1:-Global-Shell-&-Providers)
- [Source: architecture.md#Frontend-Architecture](file:///c:/Users/White/Documents/Worktree/Worktree/_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture)

## Dev Agent Record

### Creation Date

2026-01-13

### Implementation Notes (2026-01-14)

- Implemented global `Providers` component wrapping Session, Theme, Query, and Offline providers.
- Created `OfflineSyncProvider` and `OfflineIndicator` for network status management.
- Updated `RootLayout` to use providers and `Inter` font.
- Added unit tests for Providers (100% pass).
- Verified build and fixed lint errors.
