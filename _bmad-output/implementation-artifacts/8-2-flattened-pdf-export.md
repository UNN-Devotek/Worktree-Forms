# Story 8.2: Flattened PDF Export

Status: done

## Story

As a User,
I want to export my submission as a flat PDF,
So that I can email it to the city inspector.

## Acceptance Criteria

1.  **Given** a completed submission with overlay mapping
    **When** I click "Export PDF"
    **Then** the system generates a PDF with the text "burned in" to the original background
2.  **Given** the PDF is generated
    **Then** the fields are not editable (FR1.7.1)

## Tasks / Subtasks

- [x] 1. Initialize Story 8.2
  - [x] 1.1 Create story file

- [x] 2. Backend PDF Engine
  - [x] 2.1 Implement `PdfExportService` using `pdf-lib` or similar
  - [x] 2.2 Logic: Fetch Background PDF -> Draw Text at Coords -> Flatten -> Return Buffer
  - [x] 2.3 Add `/api/submissions/:id/export/pdf` endpoint

- [x] 3. Frontend UI
  - [x] 3.1 Add "Download PDF" button to Submission View
  - [x] 3.2 Handle Binary Blob response

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### File List

- `apps/backend/src/services/pdf-export.service.ts`
