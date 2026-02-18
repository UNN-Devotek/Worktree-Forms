---
stepsCompleted: []
story_key: 6-1-high-performance-data-viewing
status: ready-for-dev
tasks:
  - [x] Implement SheetShell layout with Toolbar
  - [x] Setup TanStack Table with basic columns
  - [x] Implement virtualization with TanStack Virtual
  - [x] Create mock data generator for 10k rows
  - [x] Verify 60fps scrolling
  - [x] Add basic accessibility ARIA roles
---

# Story 6.1: High-Performance Data Viewing

## Story

As a User,
I want to view sheets with 10,000+ rows without lag,
So that I can manage large projects efficiently.

## Acceptance Criteria

- [x] **Given** a dataset of 10k rows
- [x] **When** I scroll rapidly
- [ ] **Then** the UI maintains 60fps (using virtualized DOM rendering)
- [ ] **And** DOM nodes are recycled to manage memory
- [ ] **And** accessibility is maintained via standard HTML table structure (NFR12).

## Dev Notes

- **Component:** `apps/frontend/features/sheets/components/grid/SmartGrid.tsx`
- **Library:** `@tanstack/react-table` + `@tanstack/react-virtual`
- **Constraint:** Use fixed row heights initially to simplify virtualization logic.
- **Reference:** See `5-ui-implementation-map.md` Section 3.
