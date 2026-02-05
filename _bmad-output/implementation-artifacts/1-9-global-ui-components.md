---
stepsCompleted: []
story_key: 1-9-global-ui-components
status: done
tasks:
  - [x] Implement GlobalCommandPalette
  - [x] Create ModalProvider with dynamic imports
  - [x] Verify tree-shakable icons
---

# Story 1.9: Global UI Components

## Story
As a Power User,
I want to use the Command Palette and Global Modals,
So that I can navigate and perform actions quickly.

## Acceptance Criteria
- [x] **Given** I press `Cmd+K`
- [x] **Then** the `GlobalCommandPalette` opens
- [x] **And** I can navigate to different pages
- [x] **And** the `ModalProvider` uses dynamic imports (`next/dynamic`) to avoid bloating the initial bundle (Arch #2)
- [x] **And** the `ModalProvider` is implemented to handle global dialogs (UI Map 1.1, 10.0)
- [x] **And** handles "Stacked Modals" (Z-index management) correctly (Arch #5)
- [x] **And** Icon imports are tree-shakable (e.g. `lucide-react/dist/esm/icons/...`) (Arch #4).

## Dev Notes
- Moved from Epic 0 to Epic 1 during refactor.
- Already implemented in `apps/frontend/components`.
