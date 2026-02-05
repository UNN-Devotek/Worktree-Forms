# Story 7.1: RFI Management

Status: in-progress

## Story

As a Technician,
I want to create an RFI with a photo from the field,
So that I can get clarification on an issue.

## Acceptance Criteria

1. **Given** I am in the RFI module
2. **When** I click "New RFI" and attach a photo
3. **Then** the RFI is created in "Draft" state (Private to me)
4. **And** I can explicitly "Publish" it to assign to the Project Manager (PM #8) (FR20.1)

## Tasks / Subtasks

- [ ] **Data Model & Migration**
  - [ ] Update `schema.prisma` with `Rfi` model (id, title, description, status, photos, createdBy, etc.)
  - [ ] Run migration
- [ ] **Backend Services**
  - [ ] Create `RfiService` (Create, List, Update, Publish)
  - [ ] Create `RfiController` / Server Actions
- [ ] **Frontend UI**
  - [ ] Create `RfiList` component (Tabs: Drafts, Published)
  - [ ] Create `RfiDetail` / `CreateRfiModal`
  - [ ] Integrate Camera/Photo upload (reusing existing upload logic)

## Dev Notes

- **Data Model**: `Rfi` should link to `Project`. `status` enum: `DRAFT`, `OPEN`, `CLOSED`.
- **Photo Upload**: Reuse `Minio` upload logic implemented in Story 4.2.
- **State Management**: Use React Query or similar for list fetching.

## References

- [Epics.md: Story 7.1](../../_bmad-output/planning-artifacts/epics.md)
