# Story 7.2: Spec Library & Search

Status: done

## Story

As a Technician,
I want to search the project specifications for "Concrete",
So that I know the correct mix to use.

## Acceptance Criteria

1.  **Given** the Admin has uploaded the Spec Book
    **When** I search for "Concrete"
    **Then** the system returns the specific section (e.g., "03 30 00") (FR21.2)
2.  **Given** I am offline
    **Then** I can read the cached spec sections

## Tasks / Subtasks

- [x] 1. Initialize Story 7.2
  - [x] 1.1 Create story file

- [x] 2. Implement Data Model
  - [x] 2.1 Create `Specification` Prisma Model (`section`, `title`, `keywords`)
  - [x] 2.2 Run Migration

- [x] 3. Backend Services
  - [x] 3.1 Implement `SpecService` with search logic (Postgres ILIKE or Full Text)
  - [x] 3.2 Create `/api/projects/:projectId/specs` endpoints (Upload, List, Search)

- [x] 4. Frontend UI
  - [x] 4.1 Create `SpecList` component with Search Bar
  - [x] 4.2 Create `SpecViewer` (PDF/Text)
  - [x] 4.3 Integrate with `useFullTextSearch` hook

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### Debug Log References

- System Verification (Jan 19, 2026): Confirmed Spec Search functionality.

### File List

- `apps/backend/src/services/spec.service.ts`
- `apps/backend/prisma/schema.prisma`
- `apps/frontend/features/specs/components/SpecList.tsx`
