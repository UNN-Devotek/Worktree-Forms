// apps/frontend/features/sheets/types/selection.ts

export interface CellPosition {
  rowId: string;
  columnId: string;
}

export interface CellRange {
  mode: 'cells';
  anchor: CellPosition;
  active: CellPosition;
}

export interface ColumnRange {
  mode: 'columns';
  anchorColId: string;
  activeColId: string;
}

export interface RowRange {
  mode: 'rows';
  anchorRowId: string;
  activeRowId: string;
}

export type SelectionRange = CellRange | ColumnRange | RowRange;

/**
 * Discriminated update type for updateActiveSelection.
 * Must match the mode of the current active range — mismatched updates are rejected.
 */
export type SelectionActiveUpdate =
  | { mode: 'cells';   active: CellPosition }
  | { mode: 'columns'; activeColId: string }
  | { mode: 'rows';    activeRowId: string };

/**
 * Maximum number of Ctrl-accumulated ranges.
 * When the cap is reached, new Ctrl+click/drag ranges are silently ignored
 * (oldest ranges are NOT dropped — that would be disorienting).
 */
export const MAX_SELECTION_RANGES = 50;
