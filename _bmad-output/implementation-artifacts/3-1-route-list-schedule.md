# Story 3.1: Route List & Schedule

Status: done

## Story

As a Field Technician,
I want to see my daily route and schedule in a simple list,
So that I know where to go next without searching.

## Acceptance Criteria

1.  **Given** I log in to the mobile app
    **Then** I see "My Daily Route" as the default view.
2.  **Given** I have stops assigned
    **Then** they are ordered by priority and time.
3.  **Given** a stop is completed
    **Then** it shows a checkmark and moves to the bottom or dims.

## Tasks

- [x] Create `RouteList` component.
- [x] Implement API `/api/projects/:id/routes/my-daily`.
- [x] Add "Navigate" button (deeplink to Maps).
