---
stepsCompleted: []
story_key: 1-8-project-workspace-layout
status: done
tasks:
  - [x] Create ProjectLayout component
  - [x] Implement ProjectHeader with breadcrumbs
  - [x] Implement Sidebar with collapsed state persistence
  - [x] Add active tab highlighting
---

# Story 1.8: Project Workspace Layout

## Story
As a User,
I want a consistent sidebar and header navigation within a project,
So that I can switch between tools easily.

## Acceptance Criteria
- [x] **Given** I am inside a project (`/project/[id]`)
- [x] **Then** the `ProjectLayout` renders the Sidebar and Header
- [x] **And** the Header contains Breadcrumbs that dynamically resolve Deep Links (e.g. `Projects > Forms > Safety Check`) (PM #2)
- [x] **And** the UserNav dropdown renders correctly
- [x] **And** the Sidebar highlights the active tab (UI Map 4.0)
- [x] **And** Sidebar collapsed state is persisted in LocalStorage to prevent Layout Shift (Arch #1).

## Dev Notes
- Moved from Epic 0 to Epic 1 during refactor.
- Already implemented in `apps/frontend/app/(dashboard)/project/[slug]/layout.tsx`.
