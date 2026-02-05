# Story 7.3: PDF Blueprint Viewer

Status: done

## Story

As a Lead,
I want to view large blueprint PDFs on my tablet with smooth zooming,
So that I can see the details.

## Acceptance Criteria

1.  **Given** I open a 50MB Blueprint PDF
    **Then** it renders in < 3 seconds (NFR7)
2.  **Given** the blueprint is loading
    **Then** displays a Skeleton Screen loader (UX #4)
3.  **Given** the blueprint is loaded
    **Then** I can zoom and pan without lag

## Tasks / Subtasks

- [x] 1. Initialize Story 7.3
  - [x] 1.1 Create story file

- [x] 2. Backend Support
  - [x] 2.1 Add `type="BLUEPRINT"` to Specification Model
  - [x] 2.2 Ensure `UploadService` handles large PDF streams efficiently

- [x] 3. Frontend Viewer
  - [x] 3.1 Implement `BlueprintViewer` using `react-pdf` or `pdf tasks`
  - [x] 3.2 Implement Windowing/Virtualization for large files (optional)
  - [x] 3.3 Add Pan/Zoom controls

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### Debug Log References

- System Verification (Jan 19, 2026): Confirmed Blueprint Viewer renders large files smoothly.

### File List

- `apps/frontend/features/blueprints/components/BlueprintList.tsx`
- `apps/frontend/features/blueprints/components/BlueprintViewer.tsx`
