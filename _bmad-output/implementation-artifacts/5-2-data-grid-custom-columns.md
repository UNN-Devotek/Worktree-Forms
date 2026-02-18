# Story 5.2: Data Grid & Custom Columns

Status: ready-for-dev

## Story

As an Admin,
I want to view submissions in a customizable grid,
So that I can analyze specific data points.

## Acceptance Criteria

1. **Given** I am viewing the "Daily Logs" form data
2. **When** I toggle "Show only Failed Items"
3. **Then** the grid updates instantly (using `<DataTable />` wrapper around TanStack Table + Shadcn UI) (Arch #3)
4. **And** I can save this view configuration for later (stored in `UserPreferences` DB table) (Lead Dev #7) (FR4.1, FR4.2)
5. **And** I can toggle "Compact Mode" to see more rows (PM #5)
6. **And** first columns are sticky and show a shadow cue when scrolling horizontally (QA #2)

## Tasks / Subtasks

- [ ] Core Data Table Implementation (AC 1, 3)
  - [ ] Create generic `<DataTable />` wrapper component using TanStack Table v8
  - [ ] Implement virtualization for large datasets (if needed, or pagination)
  - [ ] Implement column definitions factory for dynamic form fields
- [ ] View Configuration & Persistence (AC 2, 4)
  - [ ] Add `UserPreferences` model/fields to Prisma Schema (if not exists)
  - [ ] Create Server Actions for saving/loading grid state (columns, filters, sort)
  - [ ] Implement "Save View" UI dialog
- [ ] Visual Customizations (AC 5, 6)
  - [ ] Implement "Compact Mode" toggle (reduced cell padding)
  - [ ] Implement CSS sticky positioning for first column with shadow indicator
  - [ ] Add "Show only Failed Items" quick filter

## Dev Notes

- **Architecture Constraints**:
  - Use `tanstack/react-table` headers and cell renderers.
  - Logic must live in `src/features/projects` (likely `components/submission-grid`).
  - View config should be `JSONB` in Postgres.
  - Must handle dynamic columns based on the Form Schema version.

- **Testing Standards**:
  - Unit test the column visibility logic.
  - Component test the `<DataTable />` sorting/filtering.
  - E2E test the "Save View" persistence flow.

### Project Structure Notes

- `src/components/ui/data-table` (Generic, if not exists)
- `src/features/projects/components/SubmissionGrid.tsx` (Specific)
- `src/server/api/routers/project.ts` (or `user-preferences.ts`)

### References

- [Source: planning-artifacts/epics.md#Story-5.2]
- [Source: planning-artifacts/architecture.md#Frontend-Architecture]

## Dev Agent Record

### Agent Model Used

Antigravity (simulating BMad Create-Story)

### Debug Log References

- None

### Completion Notes List

- Recreated story file from Epics artifact.

### File List
