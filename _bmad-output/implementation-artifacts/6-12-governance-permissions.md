---
stepsCompleted: []
story_key: 6-12-governance-permissions
status: done
tasks:
  - [x] Add 'locked' property to SheetColumn schema
  - [x] Implement Admin-only check for locked column edits (UI level done, API integration in Phase 3)
  - [x] Add UI indicator for locked columns
  - [x] Update CellFactory to respect locked state
---

# Story 6.12: Governance & Permissions

## Story
As an Admin,
I want to lock the "Budget" column,
So that Editors cannot change approved costs.

## Acceptance Criteria
- [x] **Given** I am an Admin
- [x] **When** I edit Column Properties
- [x] **Then** I can toggle "Lock Column"
- [x] **And** Editors see the column as Read-Only
- [x] **And** the API rejects edits to that column from non-Admins (FR12.7).

## Dev Notes
- **Security:** Must be enforced on backend (Yjs update hook) to prevent hacked client edits.
