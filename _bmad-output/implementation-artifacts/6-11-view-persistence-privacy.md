---
stepsCompleted: []
story_key: 6-11-view-persistence-privacy
status: done
tasks:
  - [x] Implement View State management (Zustand/URL)
  - [x] Sync Filter/Sort state to URL search params
  - [x] Create View Switching UI in Toolbar
  - [x] Implement view persistence via URL
---

# Story 6.11: View Persistence & Privacy

## Story
As a User,
I want to save my filters and share them via URL,
So that I can show my team exactly what I'm looking at.

## Acceptance Criteria
- [x] **Given** I filter by "Status=Open"
- [x] **Then** the URL updates to `?filter=Status:Open` (FR12.6)
- [x] **And** I can save this as a "Private View" that only I can see
- [x] **And** I can share the URL with a colleague to replicate the view.

## Dev Notes
- **State:** `SheetView` entity in Postgres stores the JSON config.
- **URL:** Use `nuqs` or similar for type-safe search param state.
