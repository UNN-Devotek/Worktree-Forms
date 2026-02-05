---
stepsCompleted: []
story_key: 1-6-global-shell-providers
status: done
tasks:
  - [x] Implement RootLayout with all providers
  - [x] Initialize OfflineSyncProvider
  - [x] Add OfflineIndicator banner
  - [x] Configure ThemeProvider to prevent hydration mismatch
  - [x] Add page transition animations
---

# Story 1.6: Global Shell & Providers

## Story
As a Developer,
I want to implement the root layout with all necessary context providers,
So that the app handles themes, sessions, and offline state correctly.

## Acceptance Criteria
- [x] **Given** I load the application
- [x] **Then** the `RootLayout` wraps children with `SessionProvider`, `ThemeProvider`, `QueryClientProvider`, `Toaster`, and `OfflineSyncProvider`
- [x] **And** `OfflineSyncProvider` initializes _after_ `QueryClient` to prevent premature retries (Lead Dev #2)
- [x] **And** the `OfflineIndicator` banner appears when network is disconnected (UI Map 1.1)
- [x] **And** `ThemeProvider` suppresses hydration mismatch to prevent FOUC (Lead Dev #5)
- [x] **And** navigation between main views uses subtle Fade/Slide transitions (UX #5).

## Dev Notes
- Moved from Epic 0 to Epic 1 during refactor.
- Already implemented in `apps/frontend/app/layout.tsx`.
