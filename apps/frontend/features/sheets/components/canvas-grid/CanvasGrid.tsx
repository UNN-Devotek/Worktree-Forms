'use client';

import React, { useState, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as Y from 'yjs';
import { CanvasRenderer } from './CanvasRenderer';
import { CellEditor } from './CellEditor';
import { AccessibleTable } from './AccessibleTable';
import { useGridKeyboard } from './hooks/useGridKeyboard';
import { useClipboard } from './hooks/useClipboard';
import { useThemeColors } from './hooks/useThemeColors';
import { useFormulaEngine } from './hooks/useFormulaEngine';
import { parseFormula, highlightFormula } from './utils/formulaHighlighter';
import {
  CellData,
  CellFormat,
  ColumnConfig,
  MergeRange,
  Cell,
  CellRange,
  Viewport,
  ROW_HEIGHT,
  DEFAULT_COLUMN_WIDTH,
  cellKey,
  getColumnLabel,
} from './types';

export interface CanvasGridRef {
  forceRender: () => void;
  setViewportScroll: (scrollY: number) => void;
}

interface CanvasGridProps {
  yjsDoc: Y.Doc;
  sheetId: string;
  width?: number;
  height?: number;
  testDataRows?: number; // Number of test rows to generate (default: 100)
}

export const CanvasGrid = forwardRef<CanvasGridRef, CanvasGridProps>(({
  yjsDoc,
  sheetId,
  width = 1200,
  height = 600,
  testDataRows = 100,
}, ref) => {
  // Theme colors hook
  const themeColors = useThemeColors();

  // Viewport state
  const [viewport, setViewport] = useState<Viewport>({
    scrollX: 0,
    scrollY: 0,
    width,
    height,
  });

  // Yjs maps
  const cellsMap = yjsDoc.getMap('cells') as Y.Map<CellData>;
  const formatsMap = yjsDoc.getMap('formats') as Y.Map<CellFormat>;
  const mergedCellsMap = yjsDoc.getMap('mergedCells') as Y.Map<MergeRange>;
  const columnsArray = yjsDoc.getArray('columns') as Y.Array<ColumnConfig>;

  // Convert Yjs to regular Map/Array for rendering
  const [cells, setCells] = useState(new Map<string, CellData>());
  const [formats, setFormats] = useState(new Map<string, CellFormat>());
  const [mergedCells, setMergedCells] = useState(new Map<string, MergeRange>());
  const [columns, setColumns] = useState<ColumnConfig[]>([]);

  // Cell reference picking mode state
  const [isPickingCellReference, setIsPickingCellReference] = useState(false);

  // Keyboard navigation hook
  const {
    mode,
    activeCell,
    selection,
    editingValue,
    setActiveCell,
    setSelection,
    enterEditMode,
    exitEditMode,
    setEditingValue,
  } = useGridKeyboard({
    maxRows: 1000,
    maxCols: 26,
    onCellChange: (row, col, value) => {
      const key = cellKey(row, col);

      // Detect if value is a formula
      const isFormula = typeof value === 'string' && value.trim().startsWith('=');

      cellsMap.set(key, {
        value: isFormula ? null : (value || null),
        formula: isFormula ? value.trim() : undefined,
        type: isFormula ? 'FORMULA' : 'TEXT',
      });
    },
  });

  // Parse formula for syntax highlighting (must be after useGridKeyboard)
  const parsedFormula = useMemo(() => {
    if (mode === 'EDITING' && editingValue && editingValue.startsWith('=')) {
      return parseFormula(editingValue);
    }
    return null;
  }, [mode, editingValue]);

  // Clipboard hook
  const { copiedRange } = useClipboard({
    cellsMap,
    activeCell,
    selection,
  });

  // Formula engine hook
  const formulaEngine = useFormulaEngine({
    yjsDoc,
    maxRows: 1000,
    maxCols: 26,
  });

  // Expose methods for benchmarking
  useImperativeHandle(ref, () => ({
    forceRender: () => {
      // Force a re-render by updating viewport
      setViewport(prev => ({ ...prev }));
    },
    setViewportScroll: (scrollY: number) => {
      setViewport(prev => ({ ...prev, scrollY }));
    },
  }), []);

  // Initialize columns if empty
  useEffect(() => {
    if (columnsArray.length === 0) {
      yjsDoc.transact(() => {
        // Create default columns A-Z
        for (let i = 0; i < 26; i++) {
          columnsArray.push([{
            id: getColumnLabel(i),
            header: getColumnLabel(i),
            width: DEFAULT_COLUMN_WIDTH,
            hidden: false,
            locked: false,
          }]);
        }
      });
    }
  }, [columnsArray, yjsDoc]);

  // Sync Yjs → React state
  useEffect(() => {
    const syncCells = () => {
      const newCells = new Map<string, CellData>();
      cellsMap.forEach((value, key) => {
        newCells.set(key, value);
      });
      setCells(newCells);
    };

    const syncFormats = () => {
      const newFormats = new Map<string, CellFormat>();
      formatsMap.forEach((value, key) => {
        newFormats.set(key, value);
      });
      setFormats(newFormats);
    };

    const syncMergedCells = () => {
      const newMergedCells = new Map<string, MergeRange>();
      mergedCellsMap.forEach((value, key) => {
        newMergedCells.set(key, value);
      });
      setMergedCells(newMergedCells);
    };

    const syncColumns = () => {
      setColumns(columnsArray.toArray());
    };

    // Initial sync
    syncCells();
    syncFormats();
    syncMergedCells();
    syncColumns();

    // Listen for changes
    cellsMap.observe(syncCells);
    formatsMap.observe(syncFormats);
    mergedCellsMap.observe(syncMergedCells);
    columnsArray.observe(syncColumns);

    return () => {
      cellsMap.unobserve(syncCells);
      formatsMap.unobserve(syncFormats);
      mergedCellsMap.unobserve(syncMergedCells);
      columnsArray.unobserve(syncColumns);
    };
  }, [cellsMap, formatsMap, mergedCellsMap, columnsArray]);

  // Handle cell click
  const handleCellClick = (cell: Cell) => {
    // If we're in cell reference picking mode, add the reference to the formula
    if (isPickingCellReference && mode === 'EDITING') {
      const cellRef = `${getColumnLabel(cell.col)}${cell.row + 1}`;
      console.log('🔗 Adding cell reference:', cellRef);

      // Append the cell reference to the current formula
      const currentValue = editingValue ?? '';
      const newValue = currentValue + cellRef;
      setEditingValue(newValue);
      return;
    }

    setActiveCell(cell);
    // Don't clear selection here - let the renderer handle it
  };

  // Handle selection change (from drag)
  const handleSelectionChange = (newSelection: CellRange | null) => {
    // If we're in cell reference picking mode, add the range reference
    if (isPickingCellReference && mode === 'EDITING' && newSelection) {
      const startRef = `${getColumnLabel(newSelection.startCol)}${newSelection.startRow + 1}`;
      const endRef = `${getColumnLabel(newSelection.endCol)}${newSelection.endRow + 1}`;
      const rangeRef = `${startRef}:${endRef}`;
      console.log('🔗 Adding range reference:', rangeRef);

      // Append the range reference to the current formula
      const currentValue = editingValue ?? '';
      const newValue = currentValue + rangeRef;
      setEditingValue(newValue);
      return;
    }

    setSelection(newSelection);
  };

  // Handle cell double-click (enter edit mode)
  const handleCellDoubleClick = (cell: Cell) => {
    setActiveCell(cell);
    setSelection(null);
    enterEditMode(); // Enter edit mode immediately
  };

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setViewport({
      scrollX: target.scrollLeft,
      scrollY: target.scrollTop,
      width,
      height,
    });
  };

  // Calculate cell editor bounds
  const editorBounds = useMemo(() => {
    if (!activeCell || mode !== 'EDITING') return null;

    let x = 0;
    for (let i = 0; i < activeCell.col && i < columns.length; i++) {
      x += columns[i].width;
    }

    const y = activeCell.row * ROW_HEIGHT;
    const cellWidth = columns[activeCell.col]?.width || DEFAULT_COLUMN_WIDTH;

    return {
      x: x - viewport.scrollX,
      y: y - viewport.scrollY,
      width: cellWidth,
      height: ROW_HEIGHT,
    };
  }, [activeCell, mode, columns, viewport]);

  // Get current cell value for editor (show formula string if formula)
  const currentCellValue = useMemo(() => {
    if (!activeCell) return '';
    const key = cellKey(activeCell.row, activeCell.col);
    const cell = cellsMap.get(key);

    // If cell has a formula, show the formula string in editor
    if (cell?.formula) {
      return cell.formula;
    }

    // Otherwise show raw value
    return String(cell?.value ?? '');
  }, [activeCell, cellsMap]);

  // Add some test data if empty
  useEffect(() => {
    if (cells.size === 0) {
      yjsDoc.transact(() => {
        // Formula demo section (first 20 rows)
        if (testDataRows >= 20) {
          // Headers
          cellsMap.set(cellKey(0, 0), { value: 'Formula Examples', type: 'TEXT' });
          cellsMap.set(cellKey(0, 2), { value: 'Numbers', type: 'TEXT' });
          cellsMap.set(cellKey(0, 3), { value: 'Formulas', type: 'TEXT' });
          cellsMap.set(cellKey(0, 4), { value: 'Results', type: 'TEXT' });

          formatsMap.set(cellKey(0, 0), { font: { family: 'Inter', size: 14, bold: true } });
          formatsMap.set(cellKey(0, 2), { font: { family: 'Inter', size: 12, bold: true } });
          formatsMap.set(cellKey(0, 3), { font: { family: 'Inter', size: 12, bold: true } });
          formatsMap.set(cellKey(0, 4), { font: { family: 'Inter', size: 12, bold: true } });

          // SUM example
          cellsMap.set(cellKey(2, 0), { value: 'SUM Example:', type: 'TEXT' });
          cellsMap.set(cellKey(2, 2), { value: 10, type: 'NUMBER' });
          cellsMap.set(cellKey(3, 2), { value: 20, type: 'NUMBER' });
          cellsMap.set(cellKey(4, 2), { value: 30, type: 'NUMBER' });
          cellsMap.set(cellKey(5, 2), { value: null, formula: '=SUM(C3:C5)', type: 'FORMULA' });
          cellsMap.set(cellKey(5, 0), { value: 'Total:', type: 'TEXT' });
          formatsMap.set(cellKey(5, 0), { font: { family: 'Inter', size: 12, bold: true } });
          formatsMap.set(cellKey(5, 2), { font: { family: 'Inter', size: 12, bold: true } });

          // AVERAGE example
          cellsMap.set(cellKey(7, 0), { value: 'AVERAGE Example:', type: 'TEXT' });
          cellsMap.set(cellKey(7, 2), { value: 100, type: 'NUMBER' });
          cellsMap.set(cellKey(8, 2), { value: 200, type: 'NUMBER' });
          cellsMap.set(cellKey(9, 2), { value: 150, type: 'NUMBER' });
          cellsMap.set(cellKey(10, 2), { value: null, formula: '=AVERAGE(C8:C10)', type: 'FORMULA' });
          cellsMap.set(cellKey(10, 0), { value: 'Average:', type: 'TEXT' });
          formatsMap.set(cellKey(10, 0), { font: { family: 'Inter', size: 12, bold: true } });
          formatsMap.set(cellKey(10, 2), { font: { family: 'Inter', size: 12, bold: true } });

          // IF example
          cellsMap.set(cellKey(12, 0), { value: 'IF Example:', type: 'TEXT' });
          cellsMap.set(cellKey(12, 2), { value: 75, type: 'NUMBER' });
          cellsMap.set(cellKey(12, 3), { value: null, formula: '=IF(C13>50,"PASS","FAIL")', type: 'FORMULA' });
          formatsMap.set(cellKey(12, 3), { font: { family: 'Inter', size: 12, bold: true } });

          // Math operations
          cellsMap.set(cellKey(14, 0), { value: 'Math Operations:', type: 'TEXT' });
          cellsMap.set(cellKey(14, 2), { value: 5, type: 'NUMBER' });
          cellsMap.set(cellKey(14, 3), { value: 3, type: 'NUMBER' });
          cellsMap.set(cellKey(15, 2), { value: null, formula: '=C15+D15', type: 'FORMULA' }); // Addition
          cellsMap.set(cellKey(16, 2), { value: null, formula: '=C15-D15', type: 'FORMULA' }); // Subtraction
          cellsMap.set(cellKey(17, 2), { value: null, formula: '=C15*D15', type: 'FORMULA' }); // Multiplication
          cellsMap.set(cellKey(18, 2), { value: null, formula: '=C15/D15', type: 'FORMULA' }); // Division
          cellsMap.set(cellKey(15, 0), { value: 'Add:', type: 'TEXT' });
          cellsMap.set(cellKey(16, 0), { value: 'Subtract:', type: 'TEXT' });
          cellsMap.set(cellKey(17, 0), { value: 'Multiply:', type: 'TEXT' });
          cellsMap.set(cellKey(18, 0), { value: 'Divide:', type: 'TEXT' });

          // Error examples
          cellsMap.set(cellKey(20, 0), { value: 'Error Examples:', type: 'TEXT' });
          cellsMap.set(cellKey(20, 2), { value: null, formula: '=1/0', type: 'FORMULA' }); // #DIV/0!
          cellsMap.set(cellKey(21, 2), { value: null, formula: '=Z999', type: 'FORMULA' }); // #REF!
          cellsMap.set(cellKey(22, 2), { value: null, formula: '=INVALIDFUNC()', type: 'FORMULA' }); // #NAME?
          cellsMap.set(cellKey(20, 1), { value: 'Division by zero:', type: 'TEXT' });
          cellsMap.set(cellKey(21, 1), { value: 'Invalid reference:', type: 'TEXT' });
          cellsMap.set(cellKey(22, 1), { value: 'Unknown function:', type: 'TEXT' });
        }

        // Fill remaining rows with generic test data
        for (let row = 25; row < testDataRows; row++) {
          for (let col = 0; col < 10; col++) {
            const key = cellKey(row, col);
            cellsMap.set(key, {
              value: `${getColumnLabel(col)}${row + 1}`,
              type: 'TEXT',
            });
          }
        }
      });
    }
  }, [cells.size, cellsMap, formatsMap, yjsDoc, testDataRows]);

  // Calculate total content size
  const contentWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const contentHeight = 1000 * ROW_HEIGHT; // 1000 rows for now

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header with sheet info */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Canvas Grid (Phase 3)</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {cells.size} cells • {columns.length} columns
          </span>
        </div>
        <div className="flex items-center gap-4">
          {mode === 'EDITING' && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              ✏️ Editing
            </div>
          )}
          {activeCell && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Active: <span className="font-mono font-semibold">{getColumnLabel(activeCell.col)}{activeCell.row + 1}</span>
            </div>
          )}
        </div>
      </div>

      {/* Formula Bar */}
      {activeCell && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex-shrink-0 px-2 py-1 text-xs font-semibold font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded">
            {getColumnLabel(activeCell.col)}{activeCell.row + 1}
          </div>
          <div className="flex-1 px-2 py-1 text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600">
            {currentCellValue ? (
              currentCellValue.startsWith('=') ? (
                <span dangerouslySetInnerHTML={{ __html: highlightFormula(currentCellValue) }} />
              ) : (
                currentCellValue
              )
            ) : (
              <span className="text-gray-400 dark:text-gray-500 italic">Empty</span>
            )}
          </div>
        </div>
      )}

      {/* Scrollable container */}
      <div
        className="overflow-auto"
        style={{ width, height: height - (activeCell ? 80 : 40) }} // Subtract header and formula bar height
        onScroll={handleScroll}
      >
        {/* Canvas grid */}
        <div style={{ width: contentWidth, height: contentHeight, position: 'relative' }}>
          <CanvasRenderer
            cells={cells}
            formats={formats}
            columns={columns}
            mergedCells={mergedCells}
            viewport={viewport}
            activeCell={activeCell}
            selection={selection}
            copiedRange={copiedRange}
            parsedFormula={parsedFormula}
            width={width}
            height={height - (activeCell ? 80 : 40)}
            onCellClick={handleCellClick}
            onCellDoubleClick={handleCellDoubleClick}
            onSelectionChange={handleSelectionChange}
            themeColors={themeColors}
            formulaEngine={formulaEngine}
          />

          {/* Cell Editor Overlay */}
          {mode === 'EDITING' && activeCell && editorBounds && (
            <CellEditor
              cell={activeCell}
              bounds={editorBounds}
              value={editingValue ?? currentCellValue}
              format={formats.get(cellKey(activeCell.row, activeCell.col))}
              onChange={setEditingValue}
              onCommit={() => exitEditMode(true)}
              onCancel={() => exitEditMode(false)}
              onCellReferenceMode={setIsPickingCellReference}
            />
          )}
        </div>
      </div>

      {/* Accessible DOM table for screen readers */}
      <AccessibleTable
        cells={cells}
        columns={columns}
        activeCell={activeCell}
        onCellFocus={setActiveCell}
        maxRows={100}
      />

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-1 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Mode: {mode}</span>
          <span>
            {selection ? (
              <>Selection: {(selection.endRow - selection.startRow + 1) * (selection.endCol - selection.startCol + 1)} cells</>
            ) : (
              <>Sheet ID: {sheetId}</>
            )}
          </span>
        </div>
      </div>
    </div>
  );
});

CanvasGrid.displayName = 'CanvasGrid';
