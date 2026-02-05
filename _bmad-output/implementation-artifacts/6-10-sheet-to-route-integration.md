---
stepsCompleted: []
story_key: 6-10-sheet-to-route-integration
status: done
tasks:
  - [x] Add 'Source Sheet' selector in Route Builder
  - [x] Implement sync listener for Address column changes
  - [x] Implement sync listener for Route Order changes
  - [x] Update RouteStops when Sheet changes
---

# Story 6.10: Sheet-to-Route Integration

## Story
As a Dispatcher,
I want to build a route by selecting rows from a master sheet,
So that I don't have to re-enter addresses.

## Acceptance Criteria
- [x] **Given** I am in the Route Builder
- [x] **When** I select "Source: Master Job List"
- [x] **Then** I can select specific rows to add to the route
- [x] **And** changes to the Stop Order in the Route Builder update the `Rank` in the Sheet
- [x] **And** modifying the address in the Sheet updates the Route Stop coordinates.

## Dev Notes
- **Data Model:** `RouteStop` needs a `sheetRowId` foreign key.
- **Bi-Directional:** This is complex. Needs careful cycle detection (Sheet -> Route -> Sheet).
