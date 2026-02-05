# Story 6.2: Formula Engine

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Planner,
I want to use formulas like SUM and VLOOKUP within the spreadsheet,
so that I can calculate totals automatically and perform data analysis without leaving the application.

## Acceptance Criteria

1.  **Formula Execution**
    - **Given** I execute a formula `=SUM(A1:A5)`
    - **Then** the cell displays the calculated result
    - **And** updates automatically if A1 changes (FR12.3).
2.  **Two-Way Data Binding**
    - **Given** I edit a cell in the FortuneSheet UI
    - **Then** the value is propagated to the Yjs `Y.Map` (or `Y.Array`) for synchronization.
    - **And** incoming Yjs updates from other users update the FortuneSheet UI without full re-creation.
3.  **Cross-Client Formula Sync**
    - **Given** User A enters a formula
    - **Then** User B sees the calculated result (assuming client-side calculation matches).
    - **Or** Formula string itself is synced.

## Tasks / Subtasks

- [ ] Task 1: Implement Two-Way Data Binding (AC: 2)
  - [ ] Subtask 1.1: Bind `Y.Map` (or `Y.Array`) events to `workbook.setData` updates or granular cell updates.
  - [ ] Subtask 1.2: Capture `onOp` or `onChange` from FortuneSheet and apply to Yjs Doc.
- [ ] Task 2: Configure Formula Presets (AC: 1)
  - [ ] Subtask 2.1: Enable FortuneSheet formula presets (SUM, AVERAGE, MIN, MAX).
  - [ ] Subtask 2.2: Verify formula evaluation logic runs correctly in the browser.
- [ ] Task 3: Synchronization Verification (AC: 3)
  - [ ] Subtask 3.1: Verify formula strings traverse the WebSocket.
  - [ ] Subtask 3.2: Verify recalculation triggers on remote updates.

## Dev Notes

- **Architecture**: We are using `@fortune-sheet/react` which has internal formula support. The challenge is syncing the _data_ behind the formula efficiently.
- **State**: We currently store the whole sheet as a byte blob in Postgres, but live sync is via Yjs.
- **Reference**: `apps/frontend/features/sheets/components/SheetEditor.tsx` relies on `useSheetSync`.

### Project Structure Notes

- Continue using `apps/frontend/features/sheets/` for all components.
- Ensure types are correctly referenced from `apps/frontend/types/fortune-sheet.d.ts`.

### References

- [Epics.md](file:///c:/Users/White/Documents/Worktree/Worktree/_bmad-output/planning-artifacts/epics.md#Story-6.2)
