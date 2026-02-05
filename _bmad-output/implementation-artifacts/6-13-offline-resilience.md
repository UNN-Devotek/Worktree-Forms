---
stepsCompleted: []
story_key: 6-13-offline-resilience
status: done
tasks:
  - [x] Integrate y-indexeddb for local persistence
  - [x] Implement connection status indicator
  - [x] Test conflict resolution on reconnect
  - [x] Handle "Row Deleted" conflicts gracefully
---

# Story 6.13: Offline Resilience

## Story
As a Technician,
I want to edit the sheet while offline,
So that I can work in the basement.

## Acceptance Criteria
- [x] **Given** I am offline
- [x] **When** I edit a cell
- [x] **Then** the change is saved to `IndexedDB`
- [x] **And** when I reconnect, the change syncs to the server
- [x] **And** if a conflict occurs (Row Deleted), the system notifies me or quarantines the edit.

## Dev Notes
- **Library:** `y-indexeddb` handles most of this automatically.
- **UX:** Critical to show "Syncing..." state so user doesn't close tab too early.
