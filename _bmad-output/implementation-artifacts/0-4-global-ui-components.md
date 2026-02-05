# Story 0.4: Global UI Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want a set of standardized, reusable UI components for common patterns (headers, empty states, loading),
so that the application has a consistent look and feel across all features.

## Acceptance Criteria

1.  **Given** the existing `shadcn/ui` foundation
2.  **Then** a reusable `PageHeader` component exists (Title, Description, Actions slot)
3.  **And** a reusable `EmptyState` component exists (Icon, Title, Description, Action Button)
4.  **And** a reusable `LoadingSpinner` component exists (Size variants, Centered variant)
5.  **And** a generic `ConfirmationDialog` component exists for destructive actions
6.  **And** all components support Light/Dark mode.

## Tasks / Subtasks

- [x] Task 1: Page Header Component (AC: 2)
  - [x] Create `apps/frontend/components/ui/page-header.tsx`
  - [x] Props: `title` (string), `description` (optional string), `children` (actions slot)
  - [x] Style: Sticky top or standard block, responsive layout

- [x] Task 2: Empty State Component (AC: 3)
  - [x] Create `apps/frontend/components/ui/empty-state.tsx`
  - [x] Props: `icon` (Lucide icon), `title`, `description`, `action` (ReactNode)
  - [x] Style: Centered, muted foreground for text, subtle background for icon

- [x] Task 3: Loading & Utility Components (AC: 4, 5)
  - [x] Create `apps/frontend/components/ui/loading-spinner.tsx` (or standard `loader.tsx`)
  - [x] Create `apps/frontend/components/ui/confirmation-dialog.tsx` (Wrapper around `AlertDialog`)
  - [x] Simplify API for `ConfirmationDialog` (e.g., `onConfirm`, `title`, `variant`='destructive')

## Dev Notes

### Architecture Patterns & Constraints

- **Placement**: Shared UI components go in `components/ui` or `components/shared`.
- **Styling**: Use Tailwind utility classes.
- **Icons**: Use `lucide-react` (standard in shadcn) or FontAwesome (if legacy, but prefer Lucide for new components).

### Project Structure Notes

- **Target**: `apps/frontend/components/ui/`
- **Prefix**: Keep names consistent (e.g., `page-header.tsx`, not `Header.tsx`).

## Dev Agent Record

### Creation Date

2026-01-13

### Completion Notes

- Verified implementations of `PageHeader`, `EmptyState`, `LoadingSpinner`, `ConfirmationDialog`.
- Created comprehensive unit tests for all components in `apps/frontend/components/ui/`.
- Updated `vitest.config.mts` to support `@` alias resolution.
- All 12 tests validated and passing.
- Addressed Code Review findings:
  - Added accessible label to `LoadingSpinner`.
  - Improved `EmptyState` flexibility with `min-h`.
  - Updated File List documentation.

### File List

- apps/frontend/components/ui/page-header.tsx [NEW]
- apps/frontend/components/ui/empty-state.tsx [NEW]
- apps/frontend/components/ui/loading-spinner.tsx [NEW]
- apps/frontend/components/ui/confirmation-dialog.tsx [NEW]
- apps/frontend/components/ui/page-header.test.tsx [NEW]
- apps/frontend/components/ui/empty-state.test.tsx [NEW]
- apps/frontend/components/ui/loading-spinner.test.tsx [NEW]
- apps/frontend/components/ui/confirmation-dialog.test.tsx [NEW]
- apps/frontend/vitest.config.mts [MODIFIED]

### Change Log

- 2026-01-15: Added unit tests and verified implementation. Updated Vitest config.
- 2026-01-15: [AI-Review] Fixed accessibility, flexibility, and documentation issues.
