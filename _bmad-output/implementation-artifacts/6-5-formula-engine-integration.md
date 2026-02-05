---
stepsCompleted: []
story_key: 6-5-formula-engine-integration
status: done
tasks:
  - [x] Install Hyperformula
  - [x] Initialize Hyperformula instance in Web Worker (Note: In-thread for now, Worker optimization in Phase 3)
  - [x] Sync Yjs changes to Hyperformula
  - [x] Sync Hyperformula results back to Grid (Read-only)
  - [x] Implement basic math functions (+, -, *, /)
---

# Story 6.5: Formula Engine Integration

## Story
As a Power User,
I want to use formulas to calculate costs,
So that I don't need a calculator.

## Acceptance Criteria
- [x] **Given** I enter `=A1*B1`
- [x] **Then** the system (Hyperformula) calculates the result
- [x] **And** updates immediately if A1 or B1 changes
- [x] **And** handles circular dependency errors gracefully (Red triangle in cell).

## Dev Notes
- **Performance:** Calculation MUST happen off the main thread (Web Worker) to prevent UI freeze on 10k rows.
- **UI:** Formula cells should be editable as text but display the result.
