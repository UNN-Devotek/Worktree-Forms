# Story 7.4: Schedule Visualization

Status: in-progress

## Story

As a Manager,
I want to view the project schedule as a filtered task list on mobile,
So that I can see upcoming milestones.

## Acceptance Criteria

1. **Given** I am on the Schedule tab on mobile
2. **Then** I see a vertical list of tasks sorted by Start Date
3. **And** "Gantt View" is disabled or simplified for small screens (FR22.3).

## Tasks / Subtasks

- [ ] **Data Model**
  - [ ] Create `ScheduleTask` model (id, projectId, title, startDate, endDate, status, assignedToId?).
  - [ ] Migration.
- [ ] **Backend Services**
  - [ ] `ScheduleService`: CRUD for tasks.
- [ ] **Frontend UI**
  - [ ] `SchedulePage`: Responsive layout.
    - [ ] Desktop: Simple Table or Gantt placeholder.
    - [ ] Mobile: Vertical List (Cards) sorted by Date.
  - [ ] `TaskModal`: Create/Edit task.

## Dev Notes

- **Simplified Schedule**: We are not building MS Project. Just a list of dates/milestones for the MVP.
- **Mobile First**: The story emphasizes mobile list view.
- **Components**: Reuse `Card` for mobile items.

## References

- [Epics.md: Story 7.4](../../_bmad-output/planning-artifacts/epics.md)
