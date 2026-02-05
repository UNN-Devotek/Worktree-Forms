# Story 7.3: PDF Blueprint Viewer

Status: in-progress

## Story

As a Lead,
I want to view large blueprint PDFs on my tablet with smooth zooming,
So that I can see the details.

## Acceptance Criteria

1. **Given** I open a 50MB Blueprint PDF
2. **Then** it renders in < 3 seconds (NFR7)
3. **And** displays a Skeleton Screen loader during fetching (UX #4)
4. **And** I can zoom and pan without lag.

## Tasks / Subtasks

- [ ] **Data Model**
  - [ ] Reuse `Specification` or Create `Blueprint` model?
  - [ ] Decision: Reuse `Specification` model but add `type` field (SPEC vs BLUEPRINT).
  - [ ] Update `schema.prisma`.
- [ ] **Frontend UI**
  - [ ] `BlueprintList`: Filtered view of Specs (Type=BLUEPRINT).
  - [ ] `BlueprintViewer`: Full-screen Iframe/Object viewer with skeleton loading.
  - [ ] `UploadBlueprintModal`: Similar to Spec upload but defaults type to BLUEPRINT.

## Checkpoint

- [ ] Schema Migration (add `type` to `Specification`).
- [ ] Verify viewer performance.

## References

- [Epics.md: Story 7.3](../../_bmad-output/planning-artifacts/epics.md)
