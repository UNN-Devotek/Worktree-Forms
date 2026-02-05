# Story 0.3: Project Workspace Layout

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want a unified workspace layout with a sidebar and project switcher,
so that I can navigate between different features and projects efficiently.

## Acceptance Criteria

- [x] Dashboard Uses Persistent Sidebar
  - **Verification**: Visually confirm sidebar remains on left across dashboard pages.
- [x] Mobile Navigation (Sheet)
  - **Verification**: Resize to mobile (<768px), click menu icon, ensure sidebar opens in drawer.
- [x] Project Switcher Exists (Stub)
  - **Verification**: Check top of sidebar for switcher component.
- [x] Responsive Layout
  - **Verification**: Ensure main content area scrolls independently of sidebar.

## Development Tasks

### 1. Unified Layout

- [x] Refactor `Sidebar` component (ensure it handles `className` prop correctly).
- [x] Create `DashboardLayout` component in `apps/frontend/features/projects/components/dashboard-layout.tsx`.
- [x] Implement `MobileNav` with `Sheet` for small screens.
- [x] Update `apps/frontend/app/(dashboard)/layout.tsx` to use `DashboardLayout`.

## Implementation Notes

- Installed `sheet` component via `npx shadcn@latest`.
- Created `MobileNav` component.
- Used `Sidebar` inside `SheetContent` for mobile view.
- Removed legacy `components/layout/Sidebar.tsx` to avoid conflicts.
- Fixed `SinglePageForm.tsx` hook violation.
- Fixed `login/page.tsx` double AuthShell usage.
- Resolved various lint/type errors to ensure clean build.
- [ ] Refactor `apps/frontend/app/(dashboard)/dashboard/page.tsx`
  - [ ] Replace `localStorage` checks with `useSession` from `next-auth/react`
  - [ ] Ensure API calls use the new query client or server actions (if applicable, otherwise keep as is for now)

## Dev Notes

### Architecture Patterns & Constraints

- **Modular Monolith**: The Sidebar belongs to the `projects` feature (Project Workspace).
- **Navigation**: Sidebar links should reflect the Feature Modules (`/projects`, `/forms`, `/users`).
- **Auth**: Remove legacy `localStorage` auth checks; rely on `SessionProvider`.

### Project Structure Notes

- **Source**: Existing `components/layout/Sidebar.tsx` -> Target: `features/projects/components/sidebar.tsx`.
- **Route**: `app/(dashboard)/layout.tsx` handles the shell for all dashboard routes.

### References

- [Source: epics.md#Story-0.3:-Project-Workspace-Layout](file:///c:/Users/White/Documents/Worktree/Worktree/_bmad-output/planning-artifacts/epics.md#Story-0.3:-Project-Workspace-Layout)
- [Source: ux-design-specification.md](file:///c:/Users/White/Documents/Worktree/Worktree/_bmad-output/planning-artifacts/ux-design-specification.md)

## Dev Agent Record

### Creation Date

2026-01-13
