'use client';

import React, { useEffect, useRef } from 'react';
import { Cell, CellData, ColumnConfig, cellKey, getColumnLabel } from './types';

interface AccessibleTableProps {
  cells: Map<string, CellData>;
  columns: ColumnConfig[];
  activeCell: Cell | null;
  onCellFocus?: (cell: Cell) => void;
  maxRows?: number;
}

/**
 * AccessibleTable - Hidden DOM table for screen reader accessibility
 *
 * Maintains a synchronized DOM table that mirrors the canvas grid,
 * providing proper ARIA labels and keyboard navigation for assistive technologies.
 */
export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  cells,
  columns,
  activeCell,
  onCellFocus,
  maxRows = 100, // Limit for performance
}) => {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Announce active cell changes to screen readers
  useEffect(() => {
    if (!activeCell || !liveRegionRef.current) return;

    const key = cellKey(activeCell.row, activeCell.col);
    const cell = cells.get(key);
    const columnLabel = columns[activeCell.col]?.id || getColumnLabel(activeCell.col);
    const cellAddress = `${columnLabel}${activeCell.row + 1}`;
    const value = cell?.value ?? 'empty';

    const announcement = `${cellAddress}: ${value}`;
    liveRegionRef.current.textContent = announcement;
  }, [activeCell, cells, columns]);

  const rows = Array.from({ length: maxRows }, (_, i) => i);

  return (
    <>
      {/* ARIA live region for announcements */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Hidden accessible table */}
      <table
        className="sr-only"
        role="grid"
        aria-label="Spreadsheet Grid"
        aria-rowcount={maxRows}
        aria-colcount={columns.length}
      >
        <thead>
          <tr role="row">
            {columns.map((col, colIdx) => (
              <th
                key={col.id}
                role="columnheader"
                scope="col"
                aria-colindex={colIdx + 1}
              >
                {col.header || col.id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((rowIdx) => (
            <tr key={rowIdx} role="row" aria-rowindex={rowIdx + 1}>
              {columns.map((col, colIdx) => {
                const key = cellKey(rowIdx, colIdx);
                const cell = cells.get(key);
                const isActive =
                  activeCell?.row === rowIdx && activeCell?.col === colIdx;
                const columnLabel = col.id || getColumnLabel(colIdx);
                const cellAddress = `${columnLabel}${rowIdx + 1}`;
                const value = cell?.value ?? '';

                return (
                  <td
                    key={key}
                    role="gridcell"
                    aria-colindex={colIdx + 1}
                    tabIndex={isActive ? 0 : -1}
                    aria-label={`${cellAddress}: ${value || 'empty'}`}
                    data-cell={key}
                    data-row={rowIdx}
                    data-col={colIdx}
                    onFocus={() => onCellFocus?.({ row: rowIdx, col: colIdx })}
                  >
                    {String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
