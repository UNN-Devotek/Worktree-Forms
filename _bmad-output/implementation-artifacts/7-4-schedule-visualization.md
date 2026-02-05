# Story 7.4: Schedule Visualization

Status: done

## Story

As a Manager,
I want to view the project schedule as a filtered task list on mobile,
So that I can see upcoming milestones.

## Acceptance Criteria

1.  **Given** I am on the Schedule tab on mobile
    **Then** I see a vertical list of tasks sorted by Start Date
2.  **Given** I am on a small screen
    **Then** "Gantt View" is disabled or simplified to prevent horizontal scrolling issues (FR22.3)

## Tasks / Subtasks

- [x] 1. Initialize Story 7.4
  - [x] 1.1 Create story file

- [x] 2. Implement Data Model
  - [x] 2.1 Create `ScheduleTask` Prisma Model (Dates, Status, Assignee)
  - [x] 2.2 Create `ScheduleDependency` (optional/future)

- [x] 3. Backend Services
  - [x] 3.1 Implement `ScheduleService` (CRUD Tasks)
  - [x] 3.2 Add `/api/projects/:projectId/schedule` endpoints

- [x] 4. Frontend UI
  - [x] 4.1 Create `ScheduleView` component
  - [x] 4.2 Implement Responsive Layout (List on mobile, Gantt on desktop)
  - [x] 4.3 Add Task Creation Modal

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### File List

- `apps/backend/src/services/schedule.service.ts`
- `apps/frontend/features/schedule/components/ScheduleView.tsx`
