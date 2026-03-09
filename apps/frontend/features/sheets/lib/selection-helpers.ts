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
