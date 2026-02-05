/**
 * useClipboard - Copy/paste functionality for canvas grid
 *
 * Implements the "hidden textarea trick" for clipboard access:
 * - Ctrl+C: Serialize selection to TSV and copy
 * - Ctrl+V: Parse TSV and paste into cells
 * - Handles multi-cell ranges
 * - Supports formula relative/absolute references (future)
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { Cell, CellRange, CellData, cellKey, detectType, getColumnLabel } from '../types';
import * as Y from 'yjs';

interface UseClipboardProps {
  cellsMap: Y.Map<CellData>;
  activeCell: Cell | null;
  selection: CellRange | null;
}

export function useClipboard({
  cellsMap,
  activeCell,
  selection,
}: UseClipboardProps) {
  // Use refs to access current values without recreating callbacks
  const cellsMapRef = useRef(cellsMap);
  const activeCellRef = useRef(activeCell);
  const selectionRef = useRef(selection);

  // Track copied range for visual feedback (Excel-style dashed border)
  const [copiedRange, setCopiedRange] = useState<CellRange | null>(null);

  // Update refs when props change
  useEffect(() => {
    cellsMapRef.current = cellsMap;
    activeCellRef.current = activeCell;
    selectionRef.current = selection;
  }, [cellsMap, activeCell, selection]);

  // Serialize range to TSV format
  const serializeToTSV = useCallback((range: CellRange): string => {
    const rows: string[] = [];

    for (let row = range.startRow; row <= range.endRow; row++) {
      const cols: string[] = [];

      for (let col = range.startCol; col <= range.endCol; col++) {
        const key = cellKey(row, col);
        const cell = cellsMapRef.current.get(key);

        // For formulas, copy the formula string; otherwise copy the value
        const value = (cell?.formula || cell?.value) ?? '';
        cols.push(String(value));
      }

      rows.push(cols.join('\t'));
    }

    return rows.join('\n');
  }, []); // No dependencies - uses ref

  // Parse TSV and paste into cells
  const parseTSV = useCallback((tsv: string, startCell: Cell) => {
    const rows = tsv.split('\n').map(row => row.split('\t'));

    // Use Yjs transaction for atomic update
    cellsMapRef.current.doc?.transact(() => {
      rows.forEach((cols, rowOffset) => {
        cols.forEach((value, colOffset) => {
          const row = startCell.row + rowOffset;
          const col = startCell.col + colOffset;
          const key = cellKey(row, col);

          // Detect if value is a formula
          const isFormula = typeof value === 'string' && value.trim().startsWith('=');

          // Set cell value or formula
          cellsMapRef.current.set(key, {
            value: isFormula ? null : (value || null),
            formula: isFormula ? value.trim() : undefined,
            type: isFormula ? 'FORMULA' : detectType(value),
          });
        });
      });
    });
  }, []); // No dependencies - uses ref

  // Handle copy (Ctrl+C)
  const handleCopy = useCallback((e: KeyboardEvent) => {
    const currentActiveCell = activeCellRef.current;
    const currentSelection = selectionRef.current;

    console.log('📋 handleCopy called, activeCell:', currentActiveCell, 'selection:', currentSelection);
    if (!currentSelection && !currentActiveCell) {
      console.log('⚠️ No active cell or selection to copy');
      return;
    }

    const range = currentSelection || {
      startRow: currentActiveCell!.row,
      startCol: currentActiveCell!.col,
      endRow: currentActiveCell!.row,
      endCol: currentActiveCell!.col,
    };

    const cellCount = (range.endRow - range.startRow + 1) * (range.endCol - range.startCol + 1);
    console.log(`📋 Copying range: ${getColumnLabel(range.startCol)}${range.startRow + 1}:${getColumnLabel(range.endCol)}${range.endRow + 1} (${cellCount} cells)`);

    // Serialize to TSV
    const tsv = serializeToTSV(range);
    console.log('📋 Copy TSV:', tsv);

    // Use clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsv)
        .then(() => {
          console.log('✅ Copied to clipboard successfully');
          console.log(`🎨 Showing dashed border for range: ${getColumnLabel(range.startCol)}${range.startRow + 1}:${getColumnLabel(range.endCol)}${range.endRow + 1}`);
          // Set copied range for visual feedback
          setCopiedRange(range);
        })
        .catch(err => {
          console.error('❌ Failed to copy to clipboard:', err);
        });
    } else {
      // Fallback: Hidden textarea trick
      console.log('📋 Using fallback clipboard method');
      const textarea = document.createElement('textarea');
      textarea.value = tsv;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);

      textarea.select();
      const success = document.execCommand('copy');

      if (success) {
        console.log('✅ Copied to clipboard successfully (fallback)');
        console.log(`🎨 Showing dashed border for range: ${getColumnLabel(range.startCol)}${range.startRow + 1}:${getColumnLabel(range.endCol)}${range.endRow + 1}`);
        setCopiedRange(range);
      } else {
        console.error('❌ Copy command failed');
      }

      document.body.removeChild(textarea);
    }

    e.preventDefault();
  }, [serializeToTSV]);

  // Handle paste (Ctrl+V)
  const handlePaste = useCallback((e: KeyboardEvent) => {
    console.log('📋 Paste key detected - waiting for paste event');
    // Don't prevent default - let the native paste event fire
    // The handlePasteEvent will handle the actual paste
  }, []);

  // Native paste event listener (for clipboard data)
  const handlePasteEvent = useCallback((e: ClipboardEvent) => {
    const currentActiveCell = activeCellRef.current;
    if (!currentActiveCell) {
      console.log('⚠️ No active cell for paste');
      return;
    }

    const tsv = e.clipboardData?.getData('text/plain');
    console.log('📋 Paste event received, data:', tsv);

    if (!tsv) {
      console.log('⚠️ No clipboard data available');
      return;
    }

    parseTSV(tsv, currentActiveCell);
    // Clear copied range after pasting
    setCopiedRange(null);
    console.log('✅ Paste completed');
    e.preventDefault();
  }, [parseTSV]);

  // Keyboard event listener for Ctrl+C/Ctrl+V/Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key === 'c') {
        console.log('⌨️ Ctrl+C detected');
        handleCopy(e);
      } else if (ctrlKey && e.key === 'v') {
        console.log('⌨️ Ctrl+V detected');
        handlePaste(e);
      } else if (e.key === 'Escape') {
        // Clear copied range on Escape
        if (copiedRange) {
          console.log('⌨️ Escape - clearing copied range');
          setCopiedRange(null);
        }
      }
    };

    // Attach to window instead of document to ensure we catch all events
    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    document.addEventListener('paste', handlePasteEvent as any);

    console.log('✅ Clipboard listeners attached');

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('paste', handlePasteEvent as any);
      console.log('❌ Clipboard listeners removed');
    };
  }, [handleCopy, handlePaste, handlePasteEvent]); // Removed copiedRange from deps

  return {
    handleCopy,
    handlePaste,
    copiedRange,
  };
}
