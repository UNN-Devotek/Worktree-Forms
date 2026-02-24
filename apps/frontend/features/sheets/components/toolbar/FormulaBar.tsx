'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSheet } from '../../providers/SheetProvider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function FormulaBar() {
  const { focusedCell, data, columns, updateCell } = useSheet();

  // Find the raw value of the focused cell
  const cellValue = (() => {
    if (!focusedCell) return '';
    const row = data.find((r: any) => r.id === focusedCell.rowId);
    if (!row) return '';
    const val = row[focusedCell.columnId];
    return val != null ? String(val) : '';
  })();

  const cellLabel = (() => {
    if (!focusedCell) return '';
    const colIndex = columns.findIndex((c: any) => c.id === focusedCell.columnId);
    const rowIndex = data.findIndex((r: any) => r.id === focusedCell.rowId);
    if (colIndex === -1 || rowIndex === -1) return '';
    // Excel-style: A1, B2, etc.
    const colLetter = String.fromCharCode(65 + colIndex);
    return `${colLetter}${rowIndex + 1}`;
  })();

  const [localValue, setLocalValue] = useState(cellValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external cell value changes (when cell is refocused or changed externally)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(cellValue);
    }
  }, [cellValue, isEditing]);

  const handleCommit = () => {
    if (!focusedCell) return;
    if (localValue !== cellValue) {
      updateCell(focusedCell.rowId, focusedCell.columnId, localValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setLocalValue(cellValue);
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div data-formula-bar className="flex items-center gap-2 px-3 py-1 border-b bg-background">
      {/* Cell reference indicator */}
      <div className="flex-none w-16 text-xs text-muted-foreground font-mono text-center border rounded px-2 py-1 bg-muted/30 truncate">
        {cellLabel || '—'}
      </div>
      <div className="flex-none text-muted-foreground text-sm font-mono">fx</div>
      <Input
        ref={inputRef}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          setIsEditing(true);
        }}
        onFocus={() => setIsEditing(true)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        placeholder={focusedCell ? '' : 'Select a cell to edit its formula'}
        disabled={!focusedCell}
        className={cn(
          'h-7 flex-1 font-mono text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent',
          !focusedCell && 'placeholder:text-muted-foreground/50'
        )}
      />
    </div>
  );
}
