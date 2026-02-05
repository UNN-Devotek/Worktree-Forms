# Story 8.2: Flattened PDF Export

Status: in-progress

## Story

As a User,
I want to export my submission as a flat PDF,
So that I can email it to the city inspector.

## Acceptance Criteria

1. **Given** a completed submission with overlay mapping
2. **When** I click "Export PDF"
3. **Then** the system generates a PDF with the text "burned in" to the original background
4. **And** it is not editable (FR1.7.1).

## Tasks / Subtasks

- [ ] **Backend Services**
  - [ ] `PdfExportService`: Use `pdf-lib` to load background and draw text.
  - [ ] API Route: `GET /api/submissions/:id/export/pdf`.
- [ ] **Frontend UI**
  - [ ] Add "Export PDF" button to `SubmissionDetail` or `SubmissionGrid`.

## Dev Notes

- **Library**: `pdf-lib` is lightweight and works well in Node.js.
- **Coordinates**: Need to map the frontend canvas coordinates (72 DPI) to the PDF coordinates. If we stored them normalized (e.g. points), it should be 1:1.
- **Fonts**: Need `StandardFonts` (Helvetica) for basic text.

## References

- [Epics.md: Story 8.2](../../_bmad-output/planning-artifacts/epics.md)
