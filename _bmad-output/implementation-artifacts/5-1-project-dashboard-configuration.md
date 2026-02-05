# Story 5.1: Project Dashboard Configuration

Status: ready-for-dev

## Story

As an Admin,
I want to see a high-level overview of project health,
So that I can spot issues immediately.

## Acceptance Criteria

1. **Given** I land on the Project Dashboard
2. **Then** I see aggregated metrics (Completion % by Form Type)
3. **And** metrics are interactive filters (clicking "80% Complete" filters the grid)
4. **And** an Activity Feed of recent submissions
5. **And** on Print (Cmd+P), the Sidebar and Nav are hidden

## Tasks / Subtasks

- [ ] **Task 1: Dashboard Layout & Print Styles**
  - [ ] Create `ProjectDashboardLayout`.
  - [ ] Add `@media print` styles to hide Sidebar/Nav.

- [ ] **Task 2: Metrics Aggregation Service**
  - [ ] Create `DashboardService.getMetrics(projectId)`.
  - [ ] Aggregations: Count by Form Type, Completion Status.

- [ ] **Task 3: Metrics Cards UI**
  - [ ] Create `MeticsGrid` component.
  - [ ] Implement interactive filtering (update query params).

- [ ] **Task 4: Activity Feed**
  - [ ] Create `ActivityFeed` component.
  - [ ] Fetch recent submissions/logs.

- [ ] **Task 5: Verification**
  - [ ] Verify print styles.
  - [ ] Verify metric calculations.
  - [ ] Verify filtering interaction.

## Dev Notes

- **Performance**: Metrics should probably be cached or optimized if the submission count is high. For now, live count is likely fine.
- **Charts**: Use `recharts` if we need visual charts, or just simple "Stat Cards" as per the requirement description.
