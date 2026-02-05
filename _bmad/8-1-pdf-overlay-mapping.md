# Story 8.1: PDF Overlay Mapping

Status: in-progress

## Story

As an Admin,
I want to drag input fields onto an uploaded Government PDF,
So that the final output looks exactly like the official form.

## Acceptance Criteria

1. **Given** I have uploaded a PDF background
2. **When** I drag a "Text Field" and place it over the "Name" box on the PDF
3. **Then** the system saves the X/Y coordinates
4. **And** normalizes them to a standard PDF viewport (e.g., 72 DPI) to prevent scaling issues (Lead Dev #8)
5. **And** uses them for generation (FR1.7).

## Tasks / Subtasks

- [ ] **Data Model**
  - [ ] Update `FormVersion` schema JSON structure to support `backgroundPdf` metadata.
  - [ ] Update field schema to support `overlay` coordinates.
- [ ] **Frontend UI**
  - [ ] `FormSettingsModal`: Add "Upload Background PDF" option.
  - [ ] `FormEditor`:
    - [ ] Add "Overlay Mode" toggle.
    - [ ] Render PDF background (using `react-pdf` or image conversion?). _Decision: Image conversion (via `pdfjs-dist` canvas export) is smoother for drag-and-drop overlays than heavy PDF viewer components, but native PDF viewer is more accurate. Let's try converting first page to image or rendering PDF Layer behind._
    - [ ] Make fields draggable/resizable over the background.
    - [ ] Save coordinates.

## Dev Notes

- **Normalization**: Store coordinates as % of page width/height or fixed points (72 DPI). Percentages are safer for responsive, but fixed points are better for PDF generation. **Decision**: Store as fixed points (72 DPI) relative to a standard page size (Letter/A4).
- **Library**: `pdfjs-dist` to render PDF to Canvas for the background layer.

## References

- [Epics.md: Story 8.1](../../_bmad-output/planning-artifacts/epics.md)
