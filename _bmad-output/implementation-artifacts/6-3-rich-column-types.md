---
stepsCompleted: []
story_key: 6-3-rich-column-types
status: done
tasks:
  - [x] Create CellFactory component
  - [x] Implement Text and Number editors
  - [x] Implement BadgeSelect editor (Status)
  - [x] Implement UserAvatar renderer
  - [x] Create ColumnManagerDialog
---

# Story 6.3: Rich Column Types

## Story
As a Planner,
I want to set columns to specific types like "Status" or "Person",
So that data entry is standardized.

## Acceptance Criteria
- [x] **Given** I add a "Status" column
- [x] **When** I edit a cell in that column
- [x] **Then** I see a Dropdown with colored badges (e.g., "In Progress" = Blue)
- [x] **And** selecting an option updates the cell value
- [x] **And** "User" columns render Avatars and support searching Project Members.

## Dev Notes
- **UI:** Smartsheet-style dropdowns.
- **Schema:** `SheetColumn` in Postgres needs to store `type` and `options` JSON.
- **Interaction:** Single click to edit for Dropdowns, Double click for Text.
