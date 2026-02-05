# Story 7.2: Spec Library & Search

Status: in-progress

## Story

As a Technician,
I want to search the project specifications for "Concrete",
So that I know the correct mix to use.

## Acceptance Criteria

1. **Given** the Admin has uploaded the Spec Book
2. **When** I search for "Concrete"
3. **Then** the system returns the specific section (e.g., "03 30 00") (FR21.2)
4. **And** I can read it offline.

## Tasks / Subtasks

- [ ] **Data Model**
  - [ ] Update `schema.prisma` with `Specification` model (section, title, content (text), url).
  - [ ] Migration.
- [ ] **Backend Services**
  - [ ] `SpecService`: Upload (+ parsing?), Search (Postgres ILIKE).
- [ ] **Frontend UI**
  - [ ] `SpecList`: Table of sections.
  - [ ] `SpecUploadModal`: Admin upload with Section # extraction input.
  - [ ] `SpecViewer`: Simple PDF link or embedded viewer (simple for now).

## Dev Notes

- **Parsing**: Full text search is hard without OCR/Text extractions. For MVP, we will rely on **Manual Metadata** entry or simplified text extraction if easy.
- **Approach**: Admin uploads PDF, enters "Section 03 30 00", "Cast-in-Place Concrete", and tags/keywords. Search filters these fields.
- **Offline**: PWA caching or simple download.

## References

- [Epics.md: Story 7.2](../../_bmad-output/planning-artifacts/epics.md)
