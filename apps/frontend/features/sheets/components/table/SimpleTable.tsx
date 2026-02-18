'use client';

import { useEffect, useState } from 'react';
import { useSheet } from '../../providers/SheetProvider';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditableCell } from './EditableCell';

export function SimpleTable() {
  const {
    data,
    columns,
    focusedCell,
    setFocusedCell,
    updateCell
  } = useSheet();

  // Screen reader announcements
  const [screenReaderMessage, setScreenReaderMessage] = useState('');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation if a cell is focused and not editing
      if (!focusedCell || !data || !columns) return;

      // Don't intercept keyboard events when user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const currentRowIndex = data.findIndex(r => r.id === focusedCell.rowId);
      const currentColIndex = columns.findIndex(c => c.id === focusedCell.columnId);

      if (currentRowIndex === -1 || currentColIndex === -1) return;

      let newRowIndex = currentRowIndex;
      let newColIndex = currentColIndex;
      let handled = false;

      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          newRowIndex = Math.min(currentRowIndex + 1, data.length - 1);
          handled = true;
          break;

        case 'ArrowUp':
          e.preventDefault();
          newRowIndex = Math.max(currentRowIndex - 1, 0);
          handled = true;
          break;

        case 'ArrowRight':
          e.preventDefault();
          newColIndex = Math.min(currentColIndex + 1, columns.length - 1);
          handled = true;
          break;

        case 'ArrowLeft':
          e.preventDefault();
          newColIndex = Math.max(currentColIndex - 1, 0);
          handled = true;
          break;

        case 'Tab':
          e.preventDefault();
          // Move to next cell, wrap to next row if at end
          if (e.shiftKey) {
            // Shift+Tab: previous cell
            newColIndex = currentColIndex - 1;
            if (newColIndex < 0) {
              newColIndex = columns.length - 1;
              newRowIndex = Math.max(currentRowIndex - 1, 0);
            }
          } else {
            // Tab: next cell
            newColIndex = currentColIndex + 1;
            if (newColIndex >= columns.length) {
              newColIndex = 0;
              newRowIndex = Math.min(currentRowIndex + 1, data.length - 1);
            }
          }
          handled = true;
          break;

        case 'Home':
          e.preventDefault();
          newColIndex = 0;
          handled = true;
          break;

        case 'End':
          e.preventDefault();
          newColIndex = columns.length - 1;
          handled = true;
          break;
      }

      if (handled && (newRowIndex !== currentRowIndex || newColIndex !== currentColIndex)) {
        setFocusedCell({
          rowId: data[newRowIndex].id,
          columnId: columns[newColIndex].id
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell, data, columns, setFocusedCell]);

  if (!data || !columns) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Announce cell focus changes to screen readers
  useEffect(() => {
    if (focusedCell && columns) {
      const column = columns.find(c => c.id === focusedCell.columnId);
      setScreenReaderMessage(`Focused ${column?.label || focusedCell.columnId}`);
    }
  }, [focusedCell, columns]);

  return (
    <>
      <div className="w-full h-full overflow-auto" aria-label="Editable data grid">
        <Table className="border-collapse">
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {columns.map(col => (
                <TableHead
                  key={col.id}
                  scope="col"
                  className="h-12 px-4 font-semibold border-b whitespace-nowrap"
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(row => (
              <TableRow key={row.id}>
                {columns.map(col => (
                  <EditableCell
                    key={`${row.id}:${col.id}`}
                    rowId={row.id}
                    columnId={col.id}
                    columnType={col.type}
                    value={row[col.id]}
                    isFocused={focusedCell?.rowId === row.id && focusedCell?.columnId === col.id}
                    onFocus={() => setFocusedCell({ rowId: row.id, columnId: col.id })}
                    onUpdate={(value) => updateCell(row.id, col.id, value)}
                  />
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Screen reader live region */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {screenReaderMessage}
      </div>
    </>
  );
}
