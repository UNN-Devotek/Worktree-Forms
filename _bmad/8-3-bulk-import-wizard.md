# Story 8.3: Bulk Import Wizard

Status: in-progress

## Story

As an Admin,
I want to paste 500 rows from Excel into a Smart Sheet,
So that I can bulk create records.

## Acceptance Criteria

1. **Given** I have data in the clipboard
2. **When** I paste into the grid
3. **Then** the system parses the columns
4. **And** enables a "Column Mapping Wizard" to align Excel headers with DB fields (PM #5)
5. **And** creates 500 new rows securely (FR4.9).

## Tasks / Subtasks

- [ ] **Frontend**
  - [ ] Implement Paste Handler in `DataGrid` (or dedicated Import button).
  - [ ] Create `ImportWizardModal`.
    - [ ] Step 1: Paste/Upload Data.
    - [ ] Step 2: Map Columns (Source Header -> Target Field).
    - [ ] Step 3: Preview & Confirm.
  - [ ] Integrate with `SmartGrid` / `ProjectDatabase`.
- [ ] **Backend**
  - [ ] Create `POST /api/projects/:id/bulk-import` endpoint.
  - [ ] Service method to validate and batch insert records.

## Dev Notes

- **Parsing**: Use `papaparse` for CSV/Clipboard text parsing.
- **Mapping**: Auto-detect mappings based on string similarity (e.g., "First Name" -> "first_name").
- **Batching**: Use Prisma `createMany` for performance.

## References

- [Epics.md: Story 8.3](../../_bmad-output/planning-artifacts/epics.md)
