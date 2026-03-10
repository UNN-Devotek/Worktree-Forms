# Multi-Cell Range Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add click-and-drag multi-cell range selection to LiveTable with Ctrl+accumulation, column/row header selection, blue highlight, and formatting applied across all selected cells.

**Architecture:** A `SelectionRange` discriminated union (mode: `cells | columns | rows`) replaces `focusedCell`, `selectedColumnIds`, and `selectedFormattingRowIds`. Pure helper functions compute cell coverage. A single `dragModeRef` + document-level `pointermove` listener (no `setPointerCapture`) handles reliable cross-element drag. A `selectionShadowMap` memo computes perimeter borders once per selection change (not per cell per render). Formatting reads row/column order directly from the Yjs document inside transactions to avoid stale closure bugs. Awareness broadcasts for selections are debounced to 100ms to avoid flooding peers during drag.

**Tech Stack:** React (useState, useMemo, useCallback, useRef, useEffect), Yjs, TanStack Virtual, TypeScript discriminated unions, Pointer Events API

**Known limitations (out of scope):**
- Auto-scroll while dragging to the edge of the virtualized viewport — requires polling during pointermove
- When `focusedCell` is null (column/row range selected), the formula bar and font-size display go blank — acceptable for this iteration; consumers already guard on null

---

## Task 1: Selection Type Definitions + Pure Helper Functions + Tests

**Files:**
- Create: `apps/frontend/features/sheets/types/selection.ts`
- Create: `apps/frontend/features/sheets/lib/selection-helpers.ts`
- Create: `apps/frontend/features/sheets/lib/__tests__/selection-helpers.test.ts`

### Step 1: Create the type file

```typescript
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
```

### Step 2: Write the failing tests

```typescript
// apps/frontend/features/sheets/lib/__tests__/selection-helpers.test.ts
import { describe, it, expect } from 'vitest';
import {
  isCellInRange,
  isColumnInRange,
  isRowInRange,
  getSelectionEdges,
  getAllSelectedCellKeys,
  anyCellInSelection,
  buildSelectionShadowMap,
} from '../selection-helpers';
import type { SelectionRange } from '../../types/selection';

const COLS = ['c1', 'c2', 'c3', 'c4'];
const ROWS = ['r1', 'r2', 'r3', 'r4'];

describe('isCellInRange', () => {
  it('returns true for cell inside a CellRange bounding box', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r3', columnId: 'c3' },
    };
    expect(isCellInRange('r2', 'c2', range, ROWS, COLS)).toBe(true);
  });

  it('returns false for cell outside a CellRange bounding box', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r2', columnId: 'c2' },
    };
    expect(isCellInRange('r4', 'c4', range, ROWS, COLS)).toBe(false);
  });

  it('handles reversed anchor/active (drag up-left)', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r3', columnId: 'c3' },
      active:  { rowId: 'r1', columnId: 'c1' },
    };
    expect(isCellInRange('r2', 'c2', range, ROWS, COLS)).toBe(true);
  });

  it('returns false (not phantom true) when rowId is unknown', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r3', columnId: 'c3' },
    };
    // 'r-DELETED' is not in ROWS — must not match row 0
    expect(isCellInRange('r-DELETED', 'c1', range, ROWS, COLS)).toBe(false);
  });

  it('returns false (not phantom true) when columnId is unknown', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r3', columnId: 'c3' },
    };
    expect(isCellInRange('r1', 'c-DELETED', range, ROWS, COLS)).toBe(false);
  });

  it('returns true for all cells in a ColumnRange', () => {
    const range: SelectionRange = { mode: 'columns', anchorColId: 'c2', activeColId: 'c3' };
    expect(isCellInRange('r4', 'c2', range, ROWS, COLS)).toBe(true);
    expect(isCellInRange('r1', 'c3', range, ROWS, COLS)).toBe(true);
    expect(isCellInRange('r2', 'c1', range, ROWS, COLS)).toBe(false);
  });

  it('returns false for ColumnRange when columnId is unknown', () => {
    const range: SelectionRange = { mode: 'columns', anchorColId: 'c1', activeColId: 'c3' };
    expect(isCellInRange('r1', 'c-DELETED', range, ROWS, COLS)).toBe(false);
  });

  it('returns true for all cells in a RowRange', () => {
    const range: SelectionRange = { mode: 'rows', anchorRowId: 'r2', activeRowId: 'r3' };
    expect(isCellInRange('r2', 'c4', range, ROWS, COLS)).toBe(true);
    expect(isCellInRange('r1', 'c1', range, ROWS, COLS)).toBe(false);
  });
});

describe('isColumnInRange', () => {
  it('returns true for column inside a ColumnRange', () => {
    const range: SelectionRange = { mode: 'columns', anchorColId: 'c1', activeColId: 'c3' };
    expect(isColumnInRange('c2', range, COLS)).toBe(true);
  });

  it('returns false for CellRange (partial column never selects header)', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c2' },
      active:  { rowId: 'r2', columnId: 'c2' },
    };
    expect(isColumnInRange('c2', range, COLS)).toBe(false);
  });

  it('handles reversed anchorColId/activeColId', () => {
    const range: SelectionRange = { mode: 'columns', anchorColId: 'c3', activeColId: 'c1' };
    expect(isColumnInRange('c2', range, COLS)).toBe(true);
  });

  it('returns false for unknown columnId', () => {
    const range: SelectionRange = { mode: 'columns', anchorColId: 'c1', activeColId: 'c3' };
    expect(isColumnInRange('c-DELETED', range, COLS)).toBe(false);
  });
});

describe('isRowInRange', () => {
  it('returns true for row inside a RowRange', () => {
    const range: SelectionRange = { mode: 'rows', anchorRowId: 'r2', activeRowId: 'r4' };
    expect(isRowInRange('r3', range, ROWS)).toBe(true);
  });

  it('returns false for row outside a RowRange', () => {
    const range: SelectionRange = { mode: 'rows', anchorRowId: 'r2', activeRowId: 'r4' };
    expect(isRowInRange('r1', range, ROWS)).toBe(false);
  });

  it('returns false for unknown rowId', () => {
    const range: SelectionRange = { mode: 'rows', anchorRowId: 'r1', activeRowId: 'r4' };
    expect(isRowInRange('r-DELETED', range, ROWS)).toBe(false);
  });
});

describe('getSelectionEdges', () => {
  it('returns correct edges for top-left corner cell', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r3', columnId: 'c3' },
    };
    expect(getSelectionEdges('r1', 'c1', range, ROWS, COLS))
      .toEqual({ top: true, bottom: false, left: true, right: false });
  });

  it('returns correct edges for bottom-right corner cell', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r3', columnId: 'c3' },
    };
    expect(getSelectionEdges('r3', 'c3', range, ROWS, COLS))
      .toEqual({ top: false, bottom: true, left: false, right: true });
  });

  it('returns null for cell not in range', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r2', columnId: 'c2' },
    };
    expect(getSelectionEdges('r4', 'c4', range, ROWS, COLS)).toBeNull();
  });

  it('returns null for unknown IDs (no phantom edges)', () => {
    const range: SelectionRange = {
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r3', columnId: 'c3' },
    };
    expect(getSelectionEdges('r-DELETED', 'c1', range, ROWS, COLS)).toBeNull();
  });

  describe('ColumnRange borders', () => {
    const range: SelectionRange = { mode: 'columns', anchorColId: 'c2', activeColId: 'c3' };

    it('first row has top:true, last row has bottom:true, interior rows have neither', () => {
      // ROWS = ['r1', 'r2', 'r3', 'r4'] — r1 is first, r4 is last
      expect(getSelectionEdges('r1', 'c2', range, ROWS, COLS)?.top).toBe(true);
      expect(getSelectionEdges('r2', 'c2', range, ROWS, COLS)?.top).toBe(false);
      expect(getSelectionEdges('r4', 'c2', range, ROWS, COLS)?.bottom).toBe(true);
      expect(getSelectionEdges('r2', 'c2', range, ROWS, COLS)?.bottom).toBe(false);
    });

    it('left border only on anchorColId side, right border only on activeColId side', () => {
      expect(getSelectionEdges('r2', 'c2', range, ROWS, COLS)?.left).toBe(true);
      expect(getSelectionEdges('r2', 'c3', range, ROWS, COLS)?.right).toBe(true);
      expect(getSelectionEdges('r2', 'c2', range, ROWS, COLS)?.right).toBe(false);
      expect(getSelectionEdges('r2', 'c3', range, ROWS, COLS)?.left).toBe(false);
    });
  });

  describe('RowRange borders', () => {
    const range: SelectionRange = { mode: 'rows', anchorRowId: 'r2', activeRowId: 'r3' };

    it('top border only on anchorRowId side, bottom border only on activeRowId side', () => {
      expect(getSelectionEdges('r2', 'c2', range, ROWS, COLS)?.top).toBe(true);
      expect(getSelectionEdges('r3', 'c2', range, ROWS, COLS)?.bottom).toBe(true);
      expect(getSelectionEdges('r2', 'c2', range, ROWS, COLS)?.bottom).toBe(false);
      expect(getSelectionEdges('r3', 'c2', range, ROWS, COLS)?.top).toBe(false);
    });

    it('left border only on first column, right border only on last column', () => {
      // COLS = ['c1', 'c2', 'c3', 'c4'] — c1 first, c4 last
      expect(getSelectionEdges('r2', 'c1', range, ROWS, COLS)?.left).toBe(true);
      expect(getSelectionEdges('r2', 'c4', range, ROWS, COLS)?.right).toBe(true);
      // Interior columns must NOT have left/right borders (avoids doubled 4px visual gap)
      expect(getSelectionEdges('r2', 'c2', range, ROWS, COLS)?.left).toBe(false);
      expect(getSelectionEdges('r2', 'c2', range, ROWS, COLS)?.right).toBe(false);
    });
  });
});

describe('getAllSelectedCellKeys', () => {
  it('enumerates all rowId:columnId keys covered by a CellRange', () => {
    const ranges: SelectionRange[] = [{
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r2', columnId: 'c2' },
    }];
    const keys = getAllSelectedCellKeys(ranges, ROWS, COLS);
    expect(keys).toEqual(expect.arrayContaining(['r1:c1', 'r1:c2', 'r2:c1', 'r2:c2']));
    expect(keys).toHaveLength(4);
  });

  it('deduplicates overlapping ranges', () => {
    const ranges: SelectionRange[] = [
      { mode: 'columns', anchorColId: 'c1', activeColId: 'c1' },
      { mode: 'columns', anchorColId: 'c1', activeColId: 'c1' },
    ];
    const keys = getAllSelectedCellKeys(ranges, ROWS, COLS);
    expect(keys).toHaveLength(ROWS.length);
  });

  it('skips ranges with unknown IDs gracefully (no crash, no phantom keys)', () => {
    const ranges: SelectionRange[] = [{
      mode: 'cells',
      anchor: { rowId: 'r-DELETED', columnId: 'c1' },
      active:  { rowId: 'r-DELETED', columnId: 'c1' },
    }];
    const keys = getAllSelectedCellKeys(ranges, ROWS, COLS);
    expect(keys).toHaveLength(0);
  });

  it('merges CellRange and ColumnRange without duplicates', () => {
    const ranges: SelectionRange[] = [
      { mode: 'cells', anchor: { rowId: 'r1', columnId: 'c1' }, active: { rowId: 'r1', columnId: 'c1' } },
      { mode: 'columns', anchorColId: 'c2', activeColId: 'c2' },
    ];
    const keys = getAllSelectedCellKeys(ranges, ROWS, COLS);
    expect(keys).toContain('r1:c1');
    expect(keys).toContain('r1:c2');
    expect(keys).toContain('r4:c2');
    expect(keys).not.toContain('r2:c1');
  });
});

describe('anyCellInSelection', () => {
  it('returns true if cell is in any range', () => {
    const ranges: SelectionRange[] = [
      { mode: 'cells', anchor: { rowId: 'r1', columnId: 'c1' }, active: { rowId: 'r1', columnId: 'c1' } },
      { mode: 'columns', anchorColId: 'c3', activeColId: 'c3' },
    ];
    expect(anyCellInSelection('r4', 'c3', ranges, ROWS, COLS)).toBe(true);
    expect(anyCellInSelection('r4', 'c2', ranges, ROWS, COLS)).toBe(false);
  });
});

describe('buildSelectionShadowMap', () => {
  it('produces correct shadow string for a single-cell selection', () => {
    const ranges: SelectionRange[] = [{
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r1', columnId: 'c1' },
    }];
    const map = buildSelectionShadowMap(ranges, ROWS, COLS);
    // Single cell has all 4 borders
    const shadow = map.get('r1:c1');
    expect(shadow).toBeDefined();
    expect(shadow).toContain('inset 0 2px');   // top
    expect(shadow).toContain('inset 0 -2px');  // bottom
    expect(shadow).toContain('inset 2px');     // left
    expect(shadow).toContain('inset -2px');    // right
  });

  it('does not produce shadows for interior cells of a multi-cell range', () => {
    const ranges: SelectionRange[] = [{
      mode: 'cells',
      anchor: { rowId: 'r1', columnId: 'c1' },
      active:  { rowId: 'r3', columnId: 'c3' },
    }];
    const map = buildSelectionShadowMap(ranges, ROWS, COLS);
    // r2:c2 is interior — no border
    expect(map.get('r2:c2')).toBeUndefined();
    // r1:c1 is top-left corner — top + left borders only
    expect(map.get('r1:c1')).toContain('inset 0 2px');  // top
    expect(map.get('r1:c1')).not.toContain('inset 0 -2px'); // no bottom
  });

  it('returns empty map when no selections', () => {
    expect(buildSelectionShadowMap([], ROWS, COLS).size).toBe(0);
  });
});
```

### Step 3: Run tests to verify they fail

```bash
cd apps/frontend && npx vitest run features/sheets/lib/__tests__/selection-helpers.test.ts
```

Expected: FAIL — `selection-helpers` module not found.

### Step 4: Create the helper implementation

```typescript
// apps/frontend/features/sheets/lib/selection-helpers.ts
import type { SelectionRange } from '../types/selection';

/**
 * Return [minIndex, maxIndex] for two IDs in an ordered list.
 * Returns null if either ID is not found — callers MUST handle null to avoid
 * phantom matches at index 0 (the classic indexOf(-1) bug).
 */
function orderedIndices(a: string, b: string, list: string[]): [number, number] | null {
  const ia = list.indexOf(a);
  const ib = list.indexOf(b);
  if (ia === -1 || ib === -1) return null;
  return ia <= ib ? [ia, ib] : [ib, ia];
}

export function isCellInRange(
  rowId: string,
  columnId: string,
  range: SelectionRange,
  rowOrder: string[],
  colOrder: string[],
): boolean {
  if (range.mode === 'columns') {
    const ci = colOrder.indexOf(columnId);
    if (ci === -1) return false;
    const idx = orderedIndices(range.anchorColId, range.activeColId, colOrder);
    if (!idx) return false;
    return ci >= idx[0] && ci <= idx[1];
  }
  if (range.mode === 'rows') {
    const ri = rowOrder.indexOf(rowId);
    if (ri === -1) return false;
    const idx = orderedIndices(range.anchorRowId, range.activeRowId, rowOrder);
    if (!idx) return false;
    return ri >= idx[0] && ri <= idx[1];
  }
  const ri = rowOrder.indexOf(rowId);
  const ci = colOrder.indexOf(columnId);
  if (ri === -1 || ci === -1) return false;
  const rowIdx = orderedIndices(range.anchor.rowId, range.active.rowId, rowOrder);
  const colIdx = orderedIndices(range.anchor.columnId, range.active.columnId, colOrder);
  if (!rowIdx || !colIdx) return false;
  return ri >= rowIdx[0] && ri <= rowIdx[1] && ci >= colIdx[0] && ci <= colIdx[1];
}

export function isColumnInRange(
  columnId: string,
  range: SelectionRange,
  colOrder: string[],
): boolean {
  if (range.mode !== 'columns') return false;
  const ci = colOrder.indexOf(columnId);
  if (ci === -1) return false;
  const idx = orderedIndices(range.anchorColId, range.activeColId, colOrder);
  if (!idx) return false;
  return ci >= idx[0] && ci <= idx[1];
}

export function isRowInRange(
  rowId: string,
  range: SelectionRange,
  rowOrder: string[],
): boolean {
  if (range.mode !== 'rows') return false;
  const ri = rowOrder.indexOf(rowId);
  if (ri === -1) return false;
  const idx = orderedIndices(range.anchorRowId, range.activeRowId, rowOrder);
  if (!idx) return false;
  return ri >= idx[0] && ri <= idx[1];
}

export interface SelectionEdges {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

/**
 * Returns which edges of this cell lie on the perimeter of the given range,
 * or null if the cell is not in the range.
 *
 * Border rules:
 * - CellRange: standard bounding-box perimeter
 * - ColumnRange: left/right at selected column edges; top only on first row,
 *   bottom only on last row (avoids doubled 4px internal borders)
 * - RowRange: top/bottom at selected row edges; left only on first column,
 *   right only on last column (same reason)
 */
export function getSelectionEdges(
  rowId: string,
  columnId: string,
  range: SelectionRange,
  rowOrder: string[],
  colOrder: string[],
): SelectionEdges | null {
  if (!isCellInRange(rowId, columnId, range, rowOrder, colOrder)) return null;

  const ri = rowOrder.indexOf(rowId);
  const ci = colOrder.indexOf(columnId);
  // isCellInRange already checked these aren't -1, but guard defensively
  if (ri === -1 || ci === -1) return null;

  if (range.mode === 'columns') {
    const idx = orderedIndices(range.anchorColId, range.activeColId, colOrder)!;
    return {
      top:    ri === 0,
      bottom: ri === rowOrder.length - 1,
      left:   ci === idx[0],
      right:  ci === idx[1],
    };
  }
  if (range.mode === 'rows') {
    const idx = orderedIndices(range.anchorRowId, range.activeRowId, rowOrder)!;
    return {
      top:    ri === idx[0],
      bottom: ri === idx[1],
      left:   ci === 0,
      right:  ci === colOrder.length - 1,
    };
  }
  const rowIdx = orderedIndices(range.anchor.rowId, range.active.rowId, rowOrder)!;
  const colIdx = orderedIndices(range.anchor.columnId, range.active.columnId, colOrder)!;
  return {
    top:    ri === rowIdx[0],
    bottom: ri === rowIdx[1],
    left:   ci === colIdx[0],
    right:  ci === colIdx[1],
  };
}

export function getAllSelectedCellKeys(
  ranges: SelectionRange[],
  rowOrder: string[],
  colOrder: string[],
): string[] {
  const keys = new Set<string>();
  for (const range of ranges) {
    if (range.mode === 'columns') {
      const idx = orderedIndices(range.anchorColId, range.activeColId, colOrder);
      if (!idx) continue; // unknown ID — skip silently
      for (const rowId of rowOrder) {
        for (let c = idx[0]; c <= idx[1]; c++) keys.add(`${rowId}:${colOrder[c]}`);
      }
    } else if (range.mode === 'rows') {
      const idx = orderedIndices(range.anchorRowId, range.activeRowId, rowOrder);
      if (!idx) continue;
      for (let r = idx[0]; r <= idx[1]; r++) {
        for (const colId of colOrder) keys.add(`${rowOrder[r]}:${colId}`);
      }
    } else {
      const rowIdx = orderedIndices(range.anchor.rowId, range.active.rowId, rowOrder);
      const colIdx = orderedIndices(range.anchor.columnId, range.active.columnId, colOrder);
      if (!rowIdx || !colIdx) continue;
      for (let r = rowIdx[0]; r <= rowIdx[1]; r++) {
        for (let c = colIdx[0]; c <= colIdx[1]; c++) {
          keys.add(`${rowOrder[r]}:${colOrder[c]}`);
        }
      }
    }
  }
  return Array.from(keys);
}

export function anyCellInSelection(
  rowId: string,
  columnId: string,
  ranges: SelectionRange[],
  rowOrder: string[],
  colOrder: string[],
): boolean {
  return ranges.some(r => isCellInRange(rowId, columnId, r, rowOrder, colOrder));
}

export function anyColumnInSelection(
  columnId: string,
  ranges: SelectionRange[],
  colOrder: string[],
): boolean {
  return ranges.some(r => isColumnInRange(columnId, r, colOrder));
}

export function anyRowInSelection(
  rowId: string,
  ranges: SelectionRange[],
  rowOrder: string[],
): boolean {
  return ranges.some(r => isRowInRange(rowId, r, rowOrder));
}

/**
 * Builds a Map<"rowId:colId", boxShadowString> for all perimeter cells across
 * all ranges. Computed once per selection change (not per-cell per-render).
 *
 * Only perimeter cells are added — interior cells are absent from the map,
 * so the render loop can use map.get() with undefined meaning "no border".
 */
export function buildSelectionShadowMap(
  ranges: SelectionRange[],
  rowOrder: string[],
  colOrder: string[],
): Map<string, string> {
  const acc = new Map<string, string[]>();
  const color = 'var(--primary)';
  const w = '2px';

  const add = (key: string, shadow: string) => {
    const existing = acc.get(key);
    if (existing) existing.push(shadow);
    else acc.set(key, [shadow]);
  };

  for (const range of ranges) {
    if (range.mode === 'cells') {
      const rowIdx = orderedIndices(range.anchor.rowId, range.active.rowId, rowOrder);
      const colIdx = orderedIndices(range.anchor.columnId, range.active.columnId, colOrder);
      if (!rowIdx || !colIdx) continue;
      const [minR, maxR] = rowIdx;
      const [minC, maxC] = colIdx;
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          // Only perimeter — skip purely interior cells
          const isPerimeter = r === minR || r === maxR || c === minC || c === maxC;
          if (!isPerimeter) continue;
          const key = `${rowOrder[r]}:${colOrder[c]}`;
          if (r === minR) add(key, `inset 0 ${w} 0 0 ${color}`);
          if (r === maxR) add(key, `inset 0 -${w} 0 0 ${color}`);
          if (c === minC) add(key, `inset ${w} 0 0 0 ${color}`);
          if (c === maxC) add(key, `inset -${w} 0 0 0 ${color}`);
        }
      }
    } else if (range.mode === 'columns') {
      const idx = orderedIndices(range.anchorColId, range.activeColId, colOrder);
      if (!idx) continue;
      const [minC, maxC] = idx;
      // Top row: top border on selected columns
      const topKey0 = `${rowOrder[0]}:`;
      const botKey0 = `${rowOrder[rowOrder.length - 1]}:`;
      for (let c = minC; c <= maxC; c++) {
        add(`${topKey0}${colOrder[c]}`, `inset 0 ${w} 0 0 ${color}`);
        add(`${botKey0}${colOrder[c]}`, `inset 0 -${w} 0 0 ${color}`);
      }
      // All rows: left border on leftmost col, right border on rightmost col
      for (const rowId of rowOrder) {
        add(`${rowId}:${colOrder[minC]}`, `inset ${w} 0 0 0 ${color}`);
        add(`${rowId}:${colOrder[maxC]}`, `inset -${w} 0 0 0 ${color}`);
      }
    } else { // rows
      const idx = orderedIndices(range.anchorRowId, range.activeRowId, rowOrder);
      if (!idx) continue;
      const [minR, maxR] = idx;
      // All cols: top border on topmost row, bottom border on bottommost row
      for (const colId of colOrder) {
        add(`${rowOrder[minR]}:${colId}`, `inset 0 ${w} 0 0 ${color}`);
        add(`${rowOrder[maxR]}:${colId}`, `inset 0 -${w} 0 0 ${color}`);
      }
      // All rows in range: left border on first col, right border on last col
      for (let r = minR; r <= maxR; r++) {
        add(`${rowOrder[r]}:${colOrder[0]}`, `inset ${w} 0 0 0 ${color}`);
        add(`${rowOrder[r]}:${colOrder[colOrder.length - 1]}`, `inset -${w} 0 0 0 ${color}`);
      }
    }
  }

  // Flatten arrays to strings
  const result = new Map<string, string>();
  for (const [key, shadows] of acc.entries()) {
    result.set(key, shadows.join(', '));
  }
  return result;
}
```

### Step 5: Run tests to verify they pass

```bash
cd apps/frontend && npx vitest run features/sheets/lib/__tests__/selection-helpers.test.ts
```

Expected: All tests PASS.

### Step 6: Commit

```bash
git add apps/frontend/features/sheets/types/selection.ts \
        apps/frontend/features/sheets/lib/selection-helpers.ts \
        apps/frontend/features/sheets/lib/__tests__/selection-helpers.test.ts
git commit -m "feat(sheets): add SelectionRange types, helpers, shadow map builder, and tests"
```

---

## Task 2: SheetProvider State Migration

**Files:**
- Modify: `apps/frontend/features/sheets/providers/SheetProvider.tsx`

### Step 1: Add imports

```typescript
import type { SelectionRange, SelectionActiveUpdate, CellPosition } from '../types/selection';
import { MAX_SELECTION_RANGES } from '../types/selection';
import { getAllSelectedCellKeys } from '../lib/selection-helpers';
```

### Step 2: Verify `setFocusedCell` call sites before removing it

Run this grep to get the exact count and line numbers — do NOT rely on "exactly 4":

```bash
grep -n "setFocusedCell" apps/frontend/features/sheets/providers/SheetProvider.tsx
```

Record every line number. You will replace each one in Step 7.

### Step 3: Replace selection state declarations

Find and remove lines 149, 158, 159:

```typescript
// REMOVE:
const [focusedCell, setFocusedCell] = useState<{ rowId: string; columnId: string } | null>(null);
const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(new Set());
const [selectedFormattingRowIds, setSelectedFormattingRowIds] = useState<Set<string>>(new Set());
```

Replace with:

```typescript
const [selections, setSelections] = useState<SelectionRange[]>([]);
const [isDraggingSelection, setIsDraggingSelection] = useState(false);

// Derived: null for column/row ranges (no single focused cell — formula bar shows blank, which is acceptable)
const focusedCell = useMemo<CellPosition | null>(() => {
  const last = selections[selections.length - 1];
  if (!last || last.mode !== 'cells') return null;
  return last.active;
}, [selections]);
```

### Step 4: Add selection mutation helpers

```typescript
const startSelection = useCallback((range: SelectionRange, ctrl: boolean) => {
  setSelections(prev => {
    if (!ctrl) return [range];
    if (prev.length >= MAX_SELECTION_RANGES) return prev; // silently ignore at cap
    return [...prev, range];
  });
  setIsDraggingSelection(true);
}, []);

/**
 * Update the active corner of the last (dragging) range.
 * Uses a discriminated update type — the mode must match the current range's mode.
 * Mismatched updates (e.g., sending activeColId when current range is 'cells') are silently rejected.
 */
const updateActiveSelection = useCallback((update: SelectionActiveUpdate) => {
  setSelections(prev => {
    if (prev.length === 0) return prev;
    const last = prev[prev.length - 1];
    if (last.mode !== update.mode) return prev; // mode mismatch — reject
    let updated: SelectionRange;
    if (update.mode === 'cells' && last.mode === 'cells') {
      updated = { ...last, active: update.active };
    } else if (update.mode === 'columns' && last.mode === 'columns') {
      updated = { ...last, activeColId: update.activeColId };
    } else if (update.mode === 'rows' && last.mode === 'rows') {
      updated = { ...last, activeRowId: update.activeRowId };
    } else {
      return prev;
    }
    return [...prev.slice(0, -1), updated];
  });
}, []);

const endSelection = useCallback(() => setIsDraggingSelection(false), []);

const clearSelections = useCallback(() => {
  setSelections([]);
  setIsDraggingSelection(false);
}, []);

const focusSingleCell = useCallback((rowId: string, columnId: string) => {
  setSelections([{ mode: 'cells', anchor: { rowId, columnId }, active: { rowId, columnId } }]);
  setIsDraggingSelection(false);
}, []);

const extendSelection = useCallback((newActive: CellPosition) => {
  setSelections(prev => {
    if (prev.length === 0) return prev;
    const last = prev[prev.length - 1];
    if (last.mode !== 'cells') return prev;
    return [...prev.slice(0, -1), { ...last, active: newActive }];
  });
}, []);
```

### Step 5: Add a test for the `startSelection` cap behavior

Add to the test file:

```typescript
// In apps/frontend/features/sheets/lib/__tests__/selection-helpers.test.ts
// (or a separate SheetProvider unit test if one exists)
// At minimum, document this behavior in a comment next to MAX_SELECTION_RANGES.
```

Since `startSelection` is inside a React component, test it by verifying the exported constant is used correctly:

```bash
grep -n "MAX_SELECTION_RANGES" apps/frontend/features/sheets/providers/SheetProvider.tsx
```

Confirm one match in `startSelection`. If zero matches, the cap was not applied — add it.

### Step 6: Update awareness broadcast with 100ms debounce

Find the `useEffect` broadcasting `focusedCell` (line ~254). Replace with:

```typescript
const awarenessSelectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  // focusedCell: cheap scalar, broadcast immediately
  provider.awareness.setLocalStateField('focusedCell', focusedCell);

  // selections: can change rapidly during drag (50+ updates/second) — debounce to avoid
  // flooding all peers with WebSocket messages on every pointermove
  if (awarenessSelectionTimerRef.current) clearTimeout(awarenessSelectionTimerRef.current);
  awarenessSelectionTimerRef.current = setTimeout(() => {
    provider.awareness.setLocalStateField('selections', selections);
  }, 100);

  return () => {
    if (awarenessSelectionTimerRef.current) clearTimeout(awarenessSelectionTimerRef.current);
  };
}, [provider, focusedCell, selections]);
```

### Step 7: Update `toggleCellStyle` — Yjs-direct reads, no stale closures

```typescript
const toggleCellStyle = useCallback((key: string) => {
  if (!doc || selections.length === 0) return;
  const map = STYLE_KEY_MAP[key as keyof typeof STYLE_KEY_MAP];
  if (!map) return;

  // IMPORTANT: Read from Yjs directly — not from rawData/columns React state.
  // React state is one render behind; using it here causes stale closure bugs
  // where formatting applies to the wrong rows after a concurrent update.
  const yOrder = doc.getArray<string>('order');
  const yColumns = doc.getArray<{ id: string; hidden?: boolean }>('columns');
  const rowIds = yOrder.toArray();
  const colIds = yColumns.toArray().filter(c => !c.hidden).map(c => c.id);

  const cellKeys = getAllSelectedCellKeys(selections, rowIds, colIds);
  if (cellKeys.length === 0) return;

  const cellsMap = doc.getMap('cells');
  const firstCell = cellsMap.get(cellKeys[0]) as any;
  const currentVal = firstCell?.style?.[map.prop] ?? map.off;
  const nextVal = currentVal === map.on ? map.off : map.on;

  doc.transact(() => {
    for (const cellKey of cellKeys) {
      const existing = cellsMap.get(cellKey) as any ?? {};
      cellsMap.set(cellKey, {
        ...existing,
        style: { ...(existing.style ?? {}), [map.prop]: nextVal },
      });
    }
  });
}, [doc, selections]);
```

### Step 8: Update context value and interface

Remove from both interface and value object: `selectedColumnIds`, `setSelectedColumnIds`, `selectedFormattingRowIds`, `setSelectedFormattingRowIds`.

Add: `selections`, `startSelection`, `updateActiveSelection`, `endSelection`, `clearSelections`, `focusSingleCell`, `extendSelection`, `isDraggingSelection`. Keep `focusedCell`.

### Step 9: Replace all `setFocusedCell` call sites

Using the line numbers from Step 2's grep, replace every occurrence:
- `setFocusedCell({ rowId, columnId })` → `focusSingleCell(rowId, columnId)`
- `setFocusedCell(null)` → `clearSelections()`

After replacing, run grep again to confirm zero remaining `setFocusedCell` references:

```bash
grep -n "setFocusedCell" apps/frontend/features/sheets/providers/SheetProvider.tsx
# Expected: no output
```

### Step 10: Run TypeScript check

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | head -60
```

Fix every new error. Common errors: context interface mismatch, consumers still referencing `selectedColumnIds`.

### Step 11: Commit

```bash
git add apps/frontend/features/sheets/providers/SheetProvider.tsx
git commit -m "feat(sheets): migrate selection state to SelectionRange[] with debounced awareness"
```

---

## Task 3: Cell + Header Drag Selection in LiveTable

**IMPORTANT — pointer event strategy:** Do NOT use `setPointerCapture`. It redirects all pointer events to the capturing element, making `document.elementFromPoint()` return that element during drag instead of the element under the pointer — breaking drag-to-select. Use `dragModeRef` + document-level `pointermove` only.

**Files:**
- Modify: `apps/frontend/features/sheets/components/LiveTable.tsx`

### Step 1: Import helpers and types

Add at top of `LiveTable.tsx` (one import block — do not add these again in later tasks):

```typescript
import type { SelectionRange, SelectionActiveUpdate } from '../types/selection';
import {
  anyCellInSelection,
  anyColumnInSelection,
  anyRowInSelection,
  buildSelectionShadowMap,
} from '../lib/selection-helpers';
```

### Step 2: Add `rowOrder` and `colOrder` memos — placement is critical

Place these **immediately after the `useSheet()` destructuring call**, before any other hook that depends on row/column counts (e.g., the virtualizer). React's rules of hooks forbid conditional hook calls — inserting a `useMemo` after a `useVirtualizer` that uses `rowOrder.length` is fine as long as all hooks are unconditional, but insert them early to keep the code readable and avoid future ordering accidents.

```typescript
// Right after: const { selections, startSelection, updateActiveSelection, ... } = useSheet();

const rowOrder = useMemo(
  () => (rawData as Array<{ id: string }>).map(r => r.id),
  [rawData],
);
const colOrder = useMemo(
  () => (columns as Array<{ id: string; hidden?: boolean }>)
    .filter(c => !c.hidden)
    .map(c => c.id),
  [columns],
);
```

### Step 3: Find the TanStack column resize handle selector

Before writing the resize disambiguation guard, run:

```bash
grep -n "resizer\|resize\|onMouseDown\|columnResizing\|getResizeHandler" \
  apps/frontend/features/sheets/components/LiveTable.tsx | head -20
```

Identify how TanStack Table's resize handle is rendered (it is typically a `<div onMouseDown={header.getResizeHandler()}>` child inside the header). Note the element type and any class or attribute it uses. The guard in Step 4 will check `e.target` against this element.

### Step 4: Add `dragModeRef` and three pointer-down handlers

```typescript
const dragModeRef = useRef<'cells' | 'columns' | 'rows' | null>(null);

const handleCellPointerDown = useCallback((
  e: React.PointerEvent<HTMLDivElement>,
  rowId: string,
  colId: string,
) => {
  if (e.button !== 0) return;
  // No preventDefault — click handler must still fire for cell focus/edit
  dragModeRef.current = 'cells';
  startSelection(
    { mode: 'cells', anchor: { rowId, columnId: colId }, active: { rowId, columnId: colId } },
    e.ctrlKey || e.metaKey,
  );
}, [startSelection]);

const handleColHeaderPointerDown = useCallback((
  e: React.PointerEvent<HTMLDivElement>,
  colId: string,
) => {
  if (e.button !== 0) return;

  // Disambiguate from TanStack resize handle.
  // TanStack renders resize handles as a child div with onMouseDown={header.getResizeHandler()}.
  // Check Step 3's grep output to confirm the exact attribute/class. Update this guard if needed.
  const target = e.target as HTMLElement;
  if (target.closest('[data-resizer]') || target.dataset.resizer !== undefined) return;

  // Prevent browser default drag-image behavior on the header element.
  // We use `user-select: none` on the header in CSS (see Step 6) instead of
  // preventDefault here to avoid breaking any other default pointer behavior.
  dragModeRef.current = 'columns';
  startSelection(
    { mode: 'columns', anchorColId: colId, activeColId: colId },
    e.ctrlKey || e.metaKey,
  );
}, [startSelection]);

const handleRowHeaderPointerDown = useCallback((
  e: React.PointerEvent<HTMLSpanElement>,
  rowId: string,
) => {
  if (e.button !== 0) return;
  dragModeRef.current = 'rows';
  startSelection(
    { mode: 'rows', anchorRowId: rowId, activeRowId: rowId },
    e.ctrlKey || e.metaKey,
  );
}, [startSelection]);
```

### Step 5: Add the document-level pointer listener

```typescript
useEffect(() => {
  const handlePointerMove = (e: PointerEvent) => {
    const mode = dragModeRef.current;
    if (!mode) return;

    if (mode === 'cells') {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const cellEl = el?.closest('[data-row-id]') as HTMLElement | null;
      const rowId = cellEl?.dataset.rowId;
      const colId = cellEl?.dataset.colId;
      if (rowId && colId) {
        const update: SelectionActiveUpdate = { mode: 'cells', active: { rowId, columnId: colId } };
        updateActiveSelection(update);
      }
    } else if (mode === 'columns') {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const headerEl = el?.closest('[data-col-header-id]') as HTMLElement | null;
      const colId = headerEl?.dataset.colHeaderId;
      if (colId) {
        const update: SelectionActiveUpdate = { mode: 'columns', activeColId: colId };
        updateActiveSelection(update);
      }
    } else {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const rowNumEl = el?.closest('[data-row-header-id]') as HTMLElement | null;
      const rowId = rowNumEl?.dataset.rowHeaderId;
      if (rowId) {
        const update: SelectionActiveUpdate = { mode: 'rows', activeRowId: rowId };
        updateActiveSelection(update);
      }
    }
  };

  const handlePointerUp = () => {
    if (!dragModeRef.current) return;
    dragModeRef.current = null;
    endSelection();
  };

  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
  return () => {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  };
}, [updateActiveSelection, endSelection]);
```

Note: `updateActiveSelection` and `endSelection` are `useCallback` values from `useSheet()`. They should be stable references (their deps are `[]` or stable). If you notice the effect re-firing unexpectedly, add `console.log('drag effect re-registered')` temporarily to diagnose.

### Step 6: Add `data-` attributes and update event handlers

**Cell divs** (line ~688):
```tsx
<div
  data-row-id={rowId}
  data-col-id={colId}
  onPointerDown={(e) => handleCellPointerDown(e, rowId, colId)}
  // remove old onMouseDown formula-drag handler OR merge logic inside handleCellPointerDown
  // keep existing onClick
>
```

**Column header divs** (line ~415) — also add `select-none` to prevent text selection during drag:
```tsx
<div
  data-col-header-id={colId}
  onPointerDown={(e) => handleColHeaderPointerDown(e, colId)}
  className={cn(
    // ... existing classes ...
    'select-none', // prevents browser text-selection during column drag
  )}
  // REMOVE: old onClick setSelectedColumnIds logic
>
```

**Row number spans** (line ~519):
```tsx
<span
  data-row-header-id={rowId}
  onPointerDown={(e) => handleRowHeaderPointerDown(e, rowId)}
  className={cn(
    // ... existing classes ...
    'select-none',
  )}
  // REMOVE: old onClick setSelectedFormattingRowIds logic
>
  {visualRowIndex + 1}
</span>
```

### Step 7: Add Escape key to keyboard handler

Find the existing Arrow key handler. Add:

```typescript
case 'Escape':
  clearSelections();
  break;
```

### Step 8: Run TypeScript check

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | head -60
```

### Step 9: Commit

```bash
git add apps/frontend/features/sheets/components/LiveTable.tsx
git commit -m "feat(sheets): add unified drag selection for cells, column headers, and row headers"
```

---

## Task 4: Visual Rendering — Blue Highlight + Perimeter Border

**Files:**
- Modify: `apps/frontend/features/sheets/components/LiveTable.tsx`

Note: helpers were already imported in Task 3 Step 1. Do not add them again.

### Step 1: Add `selectionShadowMap` memo outside the render loop

Place this after the `rowOrder`/`colOrder` memos, still at the top of the component (outside the virtualizer row loop):

```typescript
// Computes perimeter box-shadow strings for all selected cells.
// Keyed by "rowId:colId". Only perimeter cells are present — interior cells are absent (no border).
// Runs once per selection change, not once per cell per render.
const selectionShadowMap = useMemo(
  () => buildSelectionShadowMap(selections, rowOrder, colOrder),
  [selections, rowOrder, colOrder],
);
```

### Step 2: Replace the `isFocused`/`isColSelected`/`isRowSelected`/`selectionShadow` block inside the cell loop

Find lines 635–685. Replace with (inside the per-cell render, after `rowId` and `colId` are declared):

```typescript
const isFocused = focusedCell?.rowId === rowId && focusedCell?.columnId === colId;
const isSelected    = anyCellInSelection(rowId, colId, selections, rowOrder, colOrder);
const isColSelected = anyColumnInSelection(colId, selections, colOrder);
const isRowSelected = anyRowInSelection(rowId, selections, rowOrder);
const selectionShadow = selectionShadowMap.get(`${rowId}:${colId}`);
```

### Step 3: Update cell div className and style

```tsx
className={cn(
  'px-2 border-r border-table-border flex relative min-h-[40px]',
  isFocused && 'outline outline-2 outline-primary outline-offset-[-1px] z-10',
  (isSelected || isColSelected || isRowSelected) && 'bg-primary/15 z-[1]',
  isFormulaEditing && !isFocused && isRefDrag && 'bg-blue-200/50 outline outline-2 outline-blue-400',
  isFormulaEditing && 'cursor-crosshair',
)}
style={{ width: cell.column.getSize(), boxShadow: selectionShadow }}
```

### Step 4: Update column header and row number highlights

**Column header div:**
```tsx
className={cn(
  // ... all existing classes ...
  anyColumnInSelection(colId, selections, colOrder) && 'bg-primary/20 text-primary',
)}
```

**Row number span:**
```tsx
className={cn(
  // ... all existing classes ...
  anyRowInSelection(rowId, selections, rowOrder) && 'bg-primary/20 text-primary font-semibold',
)}
```

### Step 5: Run TypeScript check

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | head -60
```

### Step 6: Commit

```bash
git add apps/frontend/features/sheets/components/LiveTable.tsx
git commit -m "feat(sheets): memoized shadow map for perimeter borders, correct RowRange/ColumnRange edges"
```

---

## Task 5: Keyboard Selection — Shift+Arrow

**Files:**
- Modify: `apps/frontend/features/sheets/components/LiveTable.tsx`

### Step 1: Find the keyboard handler — exact location

Run:

```bash
grep -n "ArrowUp\|ArrowDown\|ArrowLeft\|ArrowRight\|onKeyDown" \
  apps/frontend/features/sheets/components/LiveTable.tsx | head -20
```

Note the line number. This is the handler to modify.

### Step 2: Replace Arrow handling

The `rowOrder` and `colOrder` memos from Task 3 Step 2 are already in scope. Replace the existing Arrow navigation:

```typescript
case 'ArrowUp':
case 'ArrowDown':
case 'ArrowLeft':
case 'ArrowRight': {
  e.preventDefault();
  const currentRange = selections[selections.length - 1];
  if (!currentRange || currentRange.mode !== 'cells') break;

  const activeCell = currentRange.active;
  const ri = rowOrder.indexOf(activeCell.rowId);
  const ci = colOrder.indexOf(activeCell.columnId);
  if (ri === -1 || ci === -1) break; // stale selection — bail safely

  let newRi = ri, newCi = ci;
  if (e.key === 'ArrowUp')    newRi = Math.max(0, ri - 1);
  if (e.key === 'ArrowDown')  newRi = Math.min(rowOrder.length - 1, ri + 1);
  if (e.key === 'ArrowLeft')  newCi = Math.max(0, ci - 1);
  if (e.key === 'ArrowRight') newCi = Math.min(colOrder.length - 1, ci + 1);

  const newPos = { rowId: rowOrder[newRi], columnId: colOrder[newCi] };

  if (e.shiftKey) {
    extendSelection(newPos);
  } else {
    focusSingleCell(newPos.rowId, newPos.columnId);
  }
  break;
}
```

### Step 3: Collapse multi-selection on typing

Find where cell editing begins. Run:

```bash
grep -n "setEditingCell\|startEditing\|editingCell" \
  apps/frontend/features/sheets/components/LiveTable.tsx | head -20
```

The handler that calls `setEditingCell` (or equivalent) is where a printable keypress opens the cell editor. Immediately before that call, add:

```typescript
focusSingleCell(rowId, colId); // collapse multi-selection to this cell
```

### Step 4: Run TypeScript check

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | head -60
```

### Step 5: Commit

```bash
git add apps/frontend/features/sheets/components/LiveTable.tsx
git commit -m "feat(sheets): Shift+Arrow extends selection, typing collapses to active cell"
```

---

## Task 6: Apply Formatting to All Selected Cells

**Files:**
- Modify: `apps/frontend/features/sheets/providers/SheetProvider.tsx`

### Step 1: Find all style-applying functions

```bash
grep -n "const apply\|applyCellStyle\|applyColumnStyle\|applyRowStyle\|applyTextColor\|applyBackgroundColor\|applyFontFamily\|applyFontSize\|applyTextAlign\|applyVerticalAlign\|applyWrap\|toggleCellStyle" \
  apps/frontend/features/sheets/providers/SheetProvider.tsx
```

List every function name and line number. Update each one.

### Step 2: Refactor every style function to read from Yjs and write in a single transaction

**Template (apply to each function found in Step 1):**

```typescript
const applyXxx = useCallback((value: TheType) => {
  if (!doc || selections.length === 0) return;
  // Always read from Yjs directly — never rawData/columns React state (stale closure risk)
  const rowIds = doc.getArray<string>('order').toArray();
  const colIds = doc.getArray<{ id: string; hidden?: boolean }>('columns')
    .toArray().filter(c => !c.hidden).map(c => c.id);
  const cellKeys = getAllSelectedCellKeys(selections, rowIds, colIds);
  if (cellKeys.length === 0) return;
  const cellsMap = doc.getMap('cells');
  doc.transact(() => {
    for (const key of cellKeys) {
      const existing = cellsMap.get(key) as any ?? {};
      cellsMap.set(key, {
        ...existing,
        style: { ...(existing.style ?? {}), THE_STYLE_PROP: value },
      });
    }
  });
}, [doc, selections]);
```

Replace `THE_STYLE_PROP` with: `color`, `backgroundColor`, `fontFamily`, `fontSize`, `textAlign`, `verticalAlign`, or `wrap` as appropriate.

### Step 3: Remove dead `applyColumnStyle` and `applyRowStyle`

After updating all functions, check if `applyColumnStyle` and `applyRowStyle` are still used anywhere:

```bash
grep -n "applyColumnStyle\|applyRowStyle" \
  apps/frontend/features/sheets/providers/SheetProvider.tsx \
  apps/frontend/features/sheets/components/LiveTable.tsx
```

If they only existed to service `selectedColumnIds`/`selectedFormattingRowIds` (which are now removed), delete them and remove them from the context interface and value object.

### Step 4: Run full TypeScript check

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | head -80
```

Expected: 0 new errors.

### Step 5: Run all sheet tests

```bash
cd apps/frontend && npx vitest run features/sheets/
```

Expected: All pass.

### Step 6: Run full build

```bash
cd apps/frontend && npm run build 2>&1 | tail -30
```

Expected: Exit 0. Fix any compilation errors before committing.

### Step 7: Commit

```bash
git add apps/frontend/features/sheets/providers/SheetProvider.tsx
git commit -m "feat(sheets): bulk formatting via Yjs-direct reads and single transaction per style op"
```

---

## Post-Implementation Verification

### Automated gates (all must pass before manual testing)

```bash
cd apps/frontend && npx tsc --noEmit && npx vitest run features/sheets/ && npm run build
```

### Manual browser verification

Open `http://localhost:3005/project/test-a5aVs/sheets/lrO_M8AJOJ3SkYEC7gWE4`.

- [ ] Click a cell → single blue outline, all other selections cleared
- [ ] Click and drag across multiple cells → blue fill expands, border follows bounding box without lag
- [ ] Release drag → selection stays
- [ ] Ctrl+click a second cell → second range accumulates (both highlighted)
- [ ] Ctrl+drag → adds a rectangular range to existing selection
- [ ] Ctrl+click 50 more cells (at cap) → 51st click does nothing, existing selection intact
- [ ] Click column header → entire column highlights, header bg changes
- [ ] Drag across column headers → range expands
- [ ] Click row number → entire row highlights, row number bg changes
- [ ] Drag down row numbers → range expands
- [ ] Interior cells of a row selection have NO left/right borders (only first/last column do)
- [ ] Interior cells of a column selection have NO top/bottom borders (only first/last row do)
- [ ] Apply Bold with cell range selected → all cells go bold
- [ ] Apply Bold with column selected → all cells in column go bold
- [ ] Apply text color with row selected → all cells in row change color
- [ ] Shift+ArrowRight → extends selection right (anchor stays)
- [ ] Shift+ArrowDown then Shift+ArrowRight → extends to rectangle
- [ ] ArrowDown without Shift → collapses to single cell
- [ ] Escape → clears all selections
- [ ] Start typing with range selected → collapses to active cell, enters edit mode
- [ ] Resize a column by dragging header edge → column selection does NOT trigger
- [ ] Open second browser window → collaborator cursor still shows (awareness working)
