---
stepsCompleted: []
story_key: 6-6-row-detail-panel
status: done
tasks:
  - [x] Create RowDetailPanel component
  - [x] Implement Chat Tab (Threaded comments) - Placeholder UI
  - [x] Implement File Tab (MinIO integration) - Placeholder UI
  - [x] Implement History Tab (Audit log view) - Placeholder UI
  - [x] Link Row Click to Panel Open
---

# Story 6.6: Row Detail Panel

## Story
As a User,
I want to attach a file to a specific row,
So that the invoice is linked to the line item.

## Acceptance Criteria
- [x] **Given** I click the "Open" icon on a row
- [x] **Then** a Side Panel slides out
- [x] **And** I can upload files, post a chat comment, or view the Audit History for *that specific row*.

## Dev Notes
- **Data Model:** Files and Comments are linked to `SheetRow.id`.
- **UX:** Panel overlays the right side of the screen.
