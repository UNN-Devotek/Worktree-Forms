import { describe, it, expect } from 'vitest';
import {
  isCellInRange,
  isColumnInRange,
  isRowInRange,
  getSelectionEdges,
  getAllSelectedCellKeys,
  anyCellInSelection,
  anyColumnInSelection,
  anyRowInSelection,
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

describe('anyColumnInSelection', () => {
  it('returns true when column is in a ColumnRange within the ranges array', () => {
    const ranges: SelectionRange[] = [
      { mode: 'columns', anchorColId: 'c2', activeColId: 'c3' },
    ];
    expect(anyColumnInSelection('c2', ranges, COLS)).toBe(true);
    expect(anyColumnInSelection('c3', ranges, COLS)).toBe(true);
  });

  it('returns false when column is not covered by any range', () => {
    const ranges: SelectionRange[] = [
      { mode: 'columns', anchorColId: 'c2', activeColId: 'c3' },
    ];
    expect(anyColumnInSelection('c1', ranges, COLS)).toBe(false);
    expect(anyColumnInSelection('c4', ranges, COLS)).toBe(false);
  });

  it('returns false for a CellRange even if the column overlaps', () => {
    const ranges: SelectionRange[] = [
      { mode: 'cells', anchor: { rowId: 'r1', columnId: 'c2' }, active: { rowId: 'r4', columnId: 'c2' } },
    ];
    expect(anyColumnInSelection('c2', ranges, COLS)).toBe(false);
  });

  it('returns false for unknown columnId', () => {
    const ranges: SelectionRange[] = [
      { mode: 'columns', anchorColId: 'c1', activeColId: 'c4' },
    ];
    expect(anyColumnInSelection('c-DELETED', ranges, COLS)).toBe(false);
  });
});

describe('anyRowInSelection', () => {
  it('returns true when row is in a RowRange within the ranges array', () => {
    const ranges: SelectionRange[] = [
      { mode: 'rows', anchorRowId: 'r2', activeRowId: 'r3' },
    ];
    expect(anyRowInSelection('r2', ranges, ROWS)).toBe(true);
    expect(anyRowInSelection('r3', ranges, ROWS)).toBe(true);
  });

  it('returns false when row is not covered by any range', () => {
    const ranges: SelectionRange[] = [
      { mode: 'rows', anchorRowId: 'r2', activeRowId: 'r3' },
    ];
    expect(anyRowInSelection('r1', ranges, ROWS)).toBe(false);
    expect(anyRowInSelection('r4', ranges, ROWS)).toBe(false);
  });

  it('returns false for a CellRange even if the row overlaps', () => {
    const ranges: SelectionRange[] = [
      { mode: 'cells', anchor: { rowId: 'r2', columnId: 'c1' }, active: { rowId: 'r2', columnId: 'c4' } },
    ];
    expect(anyRowInSelection('r2', ranges, ROWS)).toBe(false);
  });

  it('returns false for unknown rowId', () => {
    const ranges: SelectionRange[] = [
      { mode: 'rows', anchorRowId: 'r1', activeRowId: 'r4' },
    ];
    expect(anyRowInSelection('r-DELETED', ranges, ROWS)).toBe(false);
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
