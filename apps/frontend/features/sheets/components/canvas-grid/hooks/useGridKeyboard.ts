/**
 * useGridKeyboard - Keyboard navigation state machine for canvas grid
 *
 * Manages keyboard interactions with clean state transitions:
 * - NAVIGATION: Arrow keys move cell, Enter starts edit, typing replaces
 * - EDITING: Input field active, Enter/Tab commits, Escape cancels
 * - SELECTING: Shift+arrows expand selection
 */

import { useState, useCallback, useEffect } from 'react';
import { Cell, CellRange, GridMode, MAX_ROWS, MAX_COLS } from '../types';

interface UseGridKeyboardProps {
  maxRows?: number;
  maxCols?: number;
  onCellChange?: (row: number, col: number, value: string) => void;
}

interface UseGridKeyboardReturn {
  mode: GridMode;
  activeCell: Cell | null;
  selection: CellRange | null;
  editingValue: string | null;

  setActiveCell: (cell: Cell | null) => void;
  setSelection: (selection: CellRange | null) => void;
  enterEditMode: (initialValue?: string) => void;
  exitEditMode: (commit: boolean) => void;
  setEditingValue: (value: string) => void;
  handleKeyDown: (e: KeyboardEvent) => void;
}

export function useGridKeyboard({
  maxRows = MAX_ROWS,
  maxCols = MAX_COLS,
  onCellChange,
}: UseGridKeyboardProps = {}): UseGridKeyboardReturn {
  const [mode, setMode] = useState<GridMode>('NAVIGATION');
  const [activeCell, setActiveCell] = useState<Cell | null>(null);
  const [selection, setSelection] = useState<CellRange | null>(null);
  const [editingValue, setEditingValue] = useState<string | null>(null);

  // Move active cell by offset
  const moveActiveCell = useCallback((colOffset: number, rowOffset: number) => {
    if (!activeCell) {
      // If no active cell, start at top-left
      setActiveCell({ row: 0, col: 0 });
      return;
    }

    const newRow = Math.max(0, Math.min(activeCell.row + rowOffset, maxRows - 1));
    const newCol = Math.max(0, Math.min(activeCell.col + colOffset, maxCols - 1));

    setActiveCell({ row: newRow, col: newCol });
    setSelection(null); // Clear selection when moving
  }, [activeCell, maxRows, maxCols]);

  // Expand selection with Shift+arrows
  const expandSelection = useCallback((direction: string) => {
    if (!activeCell) return;

    const currentRange = selection || {
      startRow: activeCell.row,
      startCol: activeCell.col,
      endRow: activeCell.row,
      endCol: activeCell.col,
    };

    let newEndRow = currentRange.endRow;
    let newEndCol = currentRange.endCol;

    switch (direction) {
      case 'ArrowUp':
        newEndRow = Math.max(0, newEndRow - 1);
        break;
      case 'ArrowDown':
        newEndRow = Math.min(maxRows - 1, newEndRow + 1);
        break;
      case 'ArrowLeft':
        newEndCol = Math.max(0, newEndCol - 1);
        break;
      case 'ArrowRight':
        newEndCol = Math.min(maxCols - 1, newEndCol + 1);
        break;
    }

    setSelection({
      startRow: currentRange.startRow,
      startCol: currentRange.startCol,
      endRow: newEndRow,
      endCol: newEndCol,
    });
  }, [activeCell, selection, maxRows, maxCols]);

  // Enter edit mode
  const enterEditMode = useCallback((initialValue?: string) => {
    if (!activeCell) return;

    setMode('EDITING');
    setEditingValue(initialValue || '');
  }, [activeCell]);

  // Exit edit mode
  const exitEditMode = useCallback((commit: boolean) => {
    if (mode !== 'EDITING' || !activeCell) return;

    if (commit && editingValue !== null && onCellChange) {
      onCellChange(activeCell.row, activeCell.col, editingValue);
    }

    setMode('NAVIGATION');
    setEditingValue(null);
  }, [mode, activeCell, editingValue, onCellChange]);

  // Main keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if in editing mode (input handles its own keys)
    if (mode === 'EDITING') {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          exitEditMode(true);
          moveActiveCell(0, 1); // Move down
          break;
        case 'Tab':
          e.preventDefault();
          exitEditMode(true);
          moveActiveCell(e.shiftKey ? -1 : 1, 0); // Move left/right
          break;
        case 'Escape':
          e.preventDefault();
          exitEditMode(false);
          break;
        // All other keys pass through to input
      }
      return;
    }

    // NAVIGATION mode
    if (!activeCell) {
      // If no active cell, set to top-left on any key
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setActiveCell({ row: 0, col: 0 });
      }
      return;
    }

    // Handle Shift+arrows for selection
    if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      setMode('SELECTING');
      expandSelection(e.key);
      return;
    }

    // Handle navigation keys
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveActiveCell(0, -1);
        break;

      case 'ArrowDown':
        e.preventDefault();
        moveActiveCell(0, 1);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        moveActiveCell(-1, 0);
        break;

      case 'ArrowRight':
        e.preventDefault();
        moveActiveCell(1, 0);
        break;

      case 'Tab':
        e.preventDefault();
        moveActiveCell(e.shiftKey ? -1 : 1, 0);
        break;

      case 'Enter':
        e.preventDefault();
        enterEditMode();
        break;

      case 'F2':
        e.preventDefault();
        enterEditMode();
        break;

      case 'Escape':
        e.preventDefault();
        setActiveCell(null);
        setSelection(null);
        break;

      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (onCellChange) {
          onCellChange(activeCell.row, activeCell.col, '');
        }
        break;

      default:
        // Instant typing - if single character key, start editing with that character
        if (
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          e.preventDefault();
          enterEditMode(e.key);
        }
        break;
    }
  }, [mode, activeCell, moveActiveCell, expandSelection, enterEditMode, exitEditMode, onCellChange]);

  // Attach keyboard listener to document
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    mode,
    activeCell,
    selection,
    editingValue,
    setActiveCell,
    setSelection,
    enterEditMode,
    exitEditMode,
    setEditingValue,
    handleKeyDown,
  };
}
