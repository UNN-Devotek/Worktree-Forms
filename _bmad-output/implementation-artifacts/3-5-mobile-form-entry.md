# Story 3.5: Mobile Form Entry

Status: ready-for-dev

## Story

As a Technician,
I want to fill out the form for a stop on a mobile-optimized screen,
So that I can complete the job quickly.

## Acceptance Criteria

1.  **Given** I tap "Start Job"
    **Then** I enter the `Perform` mode (`/perform` route).
2.  **Then** I see the Form fields stacked vertically (Mobile friendly).
3.  **When** I click Submit
    **Then** it syncs (or queues if offline) and marks the stop as "Completed".

## Tasks

- [ ] Create `/project/[...]/route/stop/[id]/perform/page.tsx`.
- [ ] Reuse `FormRenderer` component.
- [ ] Add "Complete Job" wrapper logic.
