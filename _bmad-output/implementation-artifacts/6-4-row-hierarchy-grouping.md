---
stepsCompleted: []
story_key: 6-4-row-hierarchy-grouping
status: done
tasks:
  - [x] Add parentId to SheetRow model
  - [x] Implement Indent/Outdent logic in Yjs
  - [x] Render visual tree structure in Grid
  - [x] Implement Expand/Collapse toggle
  - [x] Add Drag-and-Drop for Row Reordering
---

# Story 6.4: Row Hierarchy & Grouping

## Story
As a Project Manager,
I want to indent rows to create sub-tasks,
So that I can organize the schedule visually.

## Acceptance Criteria
- [x] **Given** I have a list of tasks
- [x] **When** I select a row and click "Indent" (Tab)
- [x] **Then** it becomes a child of the row above it
- [x] **And** I can collapse/expand the parent row to hide/show children
- [x] **And** `SUM(CHILDREN())` formulas respect this hierarchy.

## Dev Notes
- **Complexity:** Flattening the tree for Virtualization while maintaining hierarchy visual is tricky. Use `depth` property on Row object.
- **Yjs:** Ensure reordering updates `rank` or `index` correctly in `Y.Array`.
