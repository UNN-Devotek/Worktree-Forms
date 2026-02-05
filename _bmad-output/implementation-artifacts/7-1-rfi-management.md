# Story 7.1: RFI Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Technician,
I want to create an RFI with a photo from the field,
So that I can get clarification on an issue.

## Acceptance Criteria

1.  **Given** I am in the RFI module
    **When** I click "New RFI" and attach a photo
    **Then** the RFI is created in "Draft" state (Private to me)
2.  **Given** I have a draft RFI
    **When** I click "Publish"
    **Then** it is assigned to the Project Manager (PM #8) (FR20.1)

## Tasks / Subtasks

- [x] 1. Initialize Story 7.1
  - [x] 1.1 Create story file

- [x] 2. Implement RFI Data Model & Migration
  - [x] 2.1 Update Prisma Schema with `Rfi`, `RfiStatus`, `RfiPriority` models
  - [x] 2.2 Create migration and apply to DB

- [x] 3. Create RFI List & Detail Views
  - [x] 3.1 Create `RfiList` component with tabs (Open, Closed, Drafts)
  - [x] 3.2 Create `CreateRfiModal` form with Zod validation
  - [x] 3.3 Implement `RfiDetail` view with status timeline

- [x] 4. Implement Photo Attachment Logic
  - [x] 4.1 Integrate `FileUpload` component in RFI form
  - [x] 4.2 Ensure images are linked to RFI entity in DB

- [x] 5. Verify Publish/Draft State
  - [x] 5.1 Verify "Save as Draft" persists but doesn't notify
  - [x] 5.2 Verify "Publish" changes status to OPEN and triggers assignment

## Dev Notes

### Architecture & Tech Stack

- **Frontend**: Next.js 14, React Hook Form, Zod, Shadcn UI (`Dialog`, `Form`, `Tabs`).
- **Backend**: Express API, Prisma ORM.
- **Storage**: MinIO for RFI attachments.

### Project Structure Notes

- Feature: `src/features/rfi`
- Components: `apps/frontend/features/rfi/components/`
- Service: `apps/backend/src/services/rfi.service.ts`

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### Debug Log References

- System Verification (Jan 19, 2026): Confirmed RFI creation and listing logic.

### Completion Notes List

- Verified RFI creation flow.
- Confirmed API fix for double `/api` prefix.
- Confirmed `'use client'` fix for list components.

### File List

- `apps/frontend/features/rfi/components/RfiList.tsx`
- `apps/frontend/features/rfi/components/CreateRfiModal.tsx`
- `apps/backend/src/services/rfi.service.ts`
- `apps/backend/prisma/schema.prisma`
