# Story 3.3: Contextual Compass

Status: ready-for-dev

## Story

As a Technician,
I want a compass that points to the specific asset (e.g., utility pole) from my current location,
So that I can find it in an open field where maps are vague.

## Acceptance Criteria

1.  **Given** I am on the "Stop Detail" page
    **Then** I see a Compass widget.
2.  **Given** I rotate my device
    **Then** the compass needle rotates to point North.
3.  **Given** the stop has coordinates
    **Then** a "Target" arrow points to the destination relative to my heading.

## Tasks

- [ ] Create `Compass` component using `DeviceOrientation` API.
- [ ] Calculate bearing between User Lat/Lng and Target Lat/Lng.
- [ ] Render SVG arrow rotating `(Bearing - Heading)`.
