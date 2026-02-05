# Story 8.3: Bulk Import Wizard

Status: done

## Story

As an Admin,
I want to paste 500 rows from Excel into a Smart Sheet,
So that I can bulk create records.

## Acceptance Criteria

1.  **Given** I have data in the clipboard
    **When** I paste into the grid
    **Then** the system parses the columns
2.  **Given** the data is parsed
    **Then** enables a "Column Mapping Wizard" to align Excel headers with DB fields (PM #5)
3.  **Given** mappings are confirmed
    **Then** creates 500 new rows securely (FR4.9)

## Tasks / Subtasks

- [x] 1. Initialize Story 8.3
  - [x] 1.1 Create story file

- [x] 2. Backend Logic
  - [x] 2.1 Implement `BulkImportService`
  - [x] 2.2 Add `/api/forms/:id/import` endpoint

- [x] 3. Frontend UI
  - [x] 3.1 Create `ImportWizardModal` component
  - [x] 3.2 Implement Paste Handler
  - [x] 3.3 Implement Column Mapper UI

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### File List

- `apps/frontend/features/projects/components/ImportWizardModal.tsx`
- `apps/backend/src/services/import.service.ts`
