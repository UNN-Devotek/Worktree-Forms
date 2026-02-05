'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Grid, Cell, SelectionArea } from '@rowsncolumns/grid';
import { Group, Rect, Text, Path } from 'react-konva';
import { useYjsStore } from '../../stores/useYjsStore';
import { cellKey, getColumnLabel, ROW_HEIGHT, DEFAULT_COLUMN_WIDTH } from './types';
import { CellEditor } from './CellEditor';
import { useTheme } from 'next-themes';
import { useFormulaEngine } from './hooks/useFormulaEngine';

interface RnCGridWrapperProps {
  sheetId: string;
  token: string;
  user: { name: string; color: string };
}

interface CellInterface {
  rowIndex: number;
  columnIndex: number;
}

const HEADER_ROW_HEIGHT = 24;
const HEADER_COLUMN_WIDTH = 50;

function detectCellType(value: any): 'number' | 'boolean' | 'text' {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === 'false') return 'boolean';
  }
  return 'text';
}

export function RnCGridWrapper({ sheetId, token, user }: RnCGridWrapperProps) {
  const { doc, connect, disconnect, isConnected } = useYjsStore();
  const [data, setData] = useState<any[][]>([]);
  const [columns, setColumns] = useState<number>(26); // A-Z, data columns
  const [rows, setRows] = useState<number>(100); // data rows
  const [activeCell, setActiveCell] = useState<CellInterface | null>(null);
  const [selections, setSelections] = useState<SelectionArea[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<CellInterface | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isPickingReference, setIsPickingReference] = useState(false);
  const { resolvedTheme } = useTheme();
  const gridRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });

  // Formula engine (always called)
  const formulaEngine = useFormulaEngine({
    yjsDoc: doc,
    maxRows: rows,
    maxCols: columns
  });

  const isDark = resolvedTheme === 'dark';
  const themeStyles = useMemo(() => ({
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f3f4f6' : '#111827',
    gridLineColor: isDark ? '#374151' : '#e5e7eb',
    headerBgColor: isDark ? '#111827' : '#f9fafb',
    headerTextColor: isDark ? '#9ca3af' : '#6b7280',
    selectionColor: isDark ? '#3b82f640' : '#3b82f620',
  }), [isDark]);

  const updateCell = useCallback((row: number, col: number, value: any, style?: any) => {
    if (!doc || !isConnected) return;
    const cellsMap = doc.getMap('cells');
    const key = cellKey(row, col);

    // If style update only
    if (value === undefined && style) {
        const current = cellsMap.get(key) as any;
        if (current) {
             const newStyle = { ...(current.style || {}), ...style };
             doc.transact(() => {
                 cellsMap.set(key, { ...current, style: newStyle });
             });
        } else {
             // New cell with style
             doc.transact(() => {
                 cellsMap.set(key, { value: null, type: 'TEXT', style });
             });
        }
        return;
    }

    // Value update
    let isFormula = false;
    let stringValue = '';

    if (typeof value === 'string') {
         isFormula = value.trim().startsWith('=');
         stringValue = value;
    } else {
         stringValue = String(value ?? '');
    }

    doc.transact(() => {
      cellsMap.set(key, {
        value: isFormula ? null : (value),
        formula: isFormula ? stringValue.trim() : undefined,
        type: isFormula ? 'FORMULA' : detectCellType(value).toUpperCase(),
        style: style,
      });
    });
  }, [doc, isConnected]);
  
  const toggleStyle = useCallback((styleKey: 'bold' | 'italic' | 'strike') => {
      if (!doc || selections.length === 0) return;
      const bounds = selections[0].bounds; 
      // Determine toggle based on active cell, like Excel
      if (!activeCell) return;
      
      const key = cellKey(activeCell.rowIndex, activeCell.columnIndex);
      const current = doc.getMap('cells').get(key) as any;
      const currentStyle = current?.style || {};
      const nextValue = !currentStyle[styleKey];

      doc.transact(() => {
          const cellsMap = doc.getMap('cells');
          // Iterate all cells in selection
          // selections are 0-based data indices in my state? 
          // Wait, handleMouseDown sets them. I need to ensure that logic is consistent.
          // Assuming selections use DATA indices (0..N)
          for (let r = bounds.top; r <= bounds.bottom; r++) {
              for (let c = bounds.left; c <= bounds.right; c++) {
                   if (r >= 0 && r < rows && c >= 0 && c < columns) {
                        const k = cellKey(r, c);
                        const cell = cellsMap.get(k) as any;
                        const newStyle = { ...(cell?.style || {}), [styleKey]: nextValue };
                        if (cell) {
                             cellsMap.set(k, { ...cell, style: newStyle });
                        } else {
                             cellsMap.set(k, { value: null, type: 'TEXT', style: newStyle });
                        }
                   }
              }
          }
      });
  }, [doc, selections, activeCell, rows, columns]);

  // Mouse Handlers for Selection
  const getCellCoordsFromStage = useCallback((x: number, y: number) => {
    let cx = -1;
    let ry = -1;
    if (x < HEADER_COLUMN_WIDTH) cx = 0;
    else cx = Math.floor((x - HEADER_COLUMN_WIDTH) / DEFAULT_COLUMN_WIDTH) + 1;
    if (y < HEADER_ROW_HEIGHT) ry = 0;
    else ry = Math.floor((y - HEADER_ROW_HEIGHT) / ROW_HEIGHT) + 1;
    return { rowIndex: ry, columnIndex: cx };
  }, []);

  const handleMouseDown = useCallback((e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const { rowIndex, columnIndex } = getCellCoordsFromStage(pos.x, pos.y);

    if (rowIndex < 0 || columnIndex < 0) return;

    // Header Selection Logic
    if (rowIndex === 0 && columnIndex === 0) {
        // Select All (Corner)
        setSelections([{ bounds: { top: 0, left: 0, bottom: rows - 1, right: columns - 1 } }]);
        setActiveCell({ rowIndex: 0, columnIndex: 0 });
        setIsSelecting(false);
        return;
    }
    
    if (rowIndex === 0) {
        // Column Selection
        const dataCol = columnIndex - 1;
        setSelections([{ bounds: { top: 0, left: dataCol, bottom: rows - 1, right: dataCol } }]);
        setActiveCell({ rowIndex: 0, columnIndex: dataCol });
        setIsSelecting(false);
        return;
    }
    
    if (columnIndex === 0) {
        // Row Selection
        const dataRow = rowIndex - 1;
        setSelections([{ bounds: { top: dataRow, left: 0, bottom: dataRow, right: columns - 1 } }]);
        setActiveCell({ rowIndex: dataRow, columnIndex: 0 });
        setIsSelecting(false);
        return;
    }

    // Data Cell Selection
    const dataRow = rowIndex - 1;
    const dataCol = columnIndex - 1;

    // If picking cell reference in formula, append it instead of committing
    if (isPickingReference && isEditing) {
        const cellRef = `${getColumnLabel(dataCol)}${dataRow + 1}`;
        setEditValue(editValue + cellRef);
        return; // Keep editor open, don't select new cell
    }

    // Commit current edit if active
    if (isEditing && activeCell) {
        updateCell(activeCell.rowIndex, activeCell.columnIndex, editValue);
    }

    setSelectionStart({ rowIndex: dataRow, columnIndex: dataCol });
    setActiveCell({ rowIndex: dataRow, columnIndex: dataCol });
    setSelections([{ bounds: { top: dataRow, left: dataCol, bottom: dataRow, right: dataCol } }]);
    setIsSelecting(true);
    setIsEditing(false); // Cancel edit
  }, [rows, columns, getCellCoordsFromStage, isEditing, activeCell, editValue, updateCell]);

  const handleMouseMove = useCallback((e: any) => {
      if (!isSelecting || !selectionStart) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const { rowIndex, columnIndex } = getCellCoordsFromStage(pos.x, pos.y);
      
      if (rowIndex <= 0 || columnIndex <= 0 || rowIndex > rows || columnIndex > columns) return;
      
      const dataRow = rowIndex - 1;
      const dataCol = columnIndex - 1;
      
      const hRow = selectionStart.rowIndex;
      const hCol = selectionStart.columnIndex;
      
      setSelections([{
          bounds: {
              top: Math.min(hRow, dataRow),
              left: Math.min(hCol, dataCol),
              bottom: Math.max(hRow, dataRow),
              right: Math.max(hCol, dataCol)
          }
      }]);
  }, [isSelecting, selectionStart, rows, columns, getCellCoordsFromStage]);

  const handleMouseUp = useCallback(() => {
      setIsSelecting(false);
  }, []);



  const handleCellDoubleClick = useCallback((rowIndex: number, columnIndex: number) => {
    if (rowIndex === 0 || columnIndex === 0 || !doc) return;

    const dataRow = rowIndex - 1;
    const dataCol = columnIndex - 1;

    setActiveCell({ rowIndex: dataRow, columnIndex: dataCol });

    const cellsMap = doc.getMap('cells');
    const key = cellKey(dataRow, dataCol);
    const cellData = cellsMap.get(key) as { formula?: string; value?: string } | undefined;

    const editString = cellData?.formula || cellData?.value || '';
    setEditValue(String(editString));
    setIsEditing(true);
  }, [doc]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!activeCell) return;
    const { rowIndex, columnIndex } = activeCell; // DATA indices

    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        updateCell(rowIndex, columnIndex, editValue);
        setIsEditing(false);
        if (rowIndex < rows - 1) {
            setActiveCell({ rowIndex: rowIndex + 1, columnIndex });
            // Update selections too
            setSelections([{ bounds: { top: rowIndex + 1, left: columnIndex, bottom: rowIndex + 1, right: columnIndex } }]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setEditValue('');
      }
      return;
    }

    // Shortcuts
    if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'b') { e.preventDefault(); toggleStyle('bold'); return; }
        if (e.key === 'i') { e.preventDefault(); toggleStyle('italic'); return; }
    }

    // Wrapper to update selection when moving
    const moveSelection = (r: number, c: number) => {
        setActiveCell({ rowIndex: r, columnIndex: c });
        setSelections([{ bounds: { top: r, left: c, bottom: r, right: c } }]);
    };

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) moveSelection(rowIndex - 1, columnIndex);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < rows - 1) moveSelection(rowIndex + 1, columnIndex);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (columnIndex > 0) moveSelection(rowIndex, columnIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (columnIndex < columns - 1) moveSelection(rowIndex, columnIndex + 1);
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        if (doc) {
          const cellsMap = doc.getMap('cells');
          const key = cellKey(rowIndex, columnIndex);
          const cellData = cellsMap.get(key) as { formula?: string; value?: string } | undefined;
          const editString = cellData?.formula || cellData?.value || '';
          setEditValue(String(editString));
        } else {
          setEditValue('');
        }
        setIsEditing(true);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        updateCell(rowIndex, columnIndex, null);
        break;
      case ' ': // Spacebar to toggle boolean
        e.preventDefault();
        // Access current value from data to toggle it?
        // We need to know if it's a boolean. The 'data' state has computed values.
        // We can check 'data' but we need to include it in deps.
        // Or blindly toggle if it looks like boolean in Yjs?
        // Safer to check data.
        // BUT 'handleKeyDown' currently doesn't have 'data' in deps and I removed it to fix lint.
        // I need to add 'data' back to deps if I use it.
        // Let's use the Yjs doc directly to check type/value to be safe and authoritative.
        if (doc) {
             const key = cellKey(rowIndex, columnIndex);
             const cellData = doc.getMap('cells').get(key) as any; // simplified access
             const navVal = cellData?.value; // Raw value
             // Or better: check the computed 'data' if available?
             // Let's just assume if it's "true"/"false" string or boolean.
             const val = navVal; 

             // Simple check:
             const isBool = typeof val === 'boolean' || val === 'true' || val === 'false' || val === 'TRUE' || val === 'FALSE';
             if (isBool) {
                 const currentBool = val === 'true' || val === 'TRUE' || val === true;
                 updateCell(rowIndex, columnIndex, !currentBool);
             }
        }
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setEditValue(e.key);
          setIsEditing(true);
        }
        break;
    }
  }, [activeCell, isEditing, editValue, rows, columns, updateCell, doc]);

  useEffect(() => {
    if (!isConnected && sheetId && token) connect(sheetId, token, user);
    return () => { if (isConnected) disconnect(); };
  }, [sheetId, token, user, isConnected, connect, disconnect]);

  // Sync Yjs data to local state (fix: don't depend on formulaEngine to avoid infinite loop)
  useEffect(() => {
    if (!isConnected || !doc) return;
    const cellsMap = doc.getMap('cells');
    const updateData = () => {
      const matrix: any[][] = [];
      for (let r = 0; r < rows; r++) {
        matrix[r] = [];
        for (let c = 0; c < columns; c++) {
          // Use formulaEngine via closure (it's stable enough for this use)
          matrix[r][c] = formulaEngine.getCellValue(r, c);
        }
      }
      setData(matrix);
    };
    updateData();
    cellsMap.observe(updateData);
    return () => cellsMap.unobserve(updateData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, isConnected, rows, columns]); // Removed formulaEngine from deps to prevent infinite loop

  useEffect(() => {
    const handleKeyDownWrapper = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', handleKeyDownWrapper);
    return () => window.removeEventListener('keydown', handleKeyDownWrapper);
  }, [handleKeyDown]);

  // Dynamic grid sizing - make it fill the container
  useEffect(() => {
    if (!gridRef.current) return;

    const updateDimensions = () => {
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        // Only update if dimensions actually changed (prevents re-render loops)
        setGridDimensions(prev => {
          if (prev.width === rect.width && prev.height === rect.height) {
            return prev; // No change, prevent re-render
          }
          return {
            width: rect.width,
            height: rect.height
          };
        });
      }
    };

    // Use RAF to avoid measurement timing issues
    requestAnimationFrame(updateDimensions);

    // Observe size changes
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateDimensions);
    });
    resizeObserver.observe(gridRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []); // Stable - no dependencies

  const getActiveCellBounds = useCallback(() => {
    if (!activeCell) return null;
    // Offset by header dimensions
    const x = HEADER_COLUMN_WIDTH + (activeCell.columnIndex * DEFAULT_COLUMN_WIDTH);
    const y = HEADER_ROW_HEIGHT + (activeCell.rowIndex * ROW_HEIGHT);
    return { x, y, width: DEFAULT_COLUMN_WIDTH, height: ROW_HEIGHT };
  }, [activeCell]);

  const activeCellBounds = getActiveCellBounds();

  if (!isConnected || gridDimensions.width === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">
            {!isConnected ? 'Connecting to sheet...' : 'Loading sheet...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
        <div ref={gridRef} className="flex-1 relative bg-background border border-border overflow-hidden" tabIndex={0}>
          <Grid
        rowCount={rows + 1}
        columnCount={columns + 1}
        frozenRows={1}
        frozenColumns={1}
        width={gridDimensions.width}
        height={gridDimensions.height}
        rowHeight={(index) => index === 0 ? HEADER_ROW_HEIGHT : ROW_HEIGHT}
        columnWidth={(index) => index === 0 ? HEADER_COLUMN_WIDTH : DEFAULT_COLUMN_WIDTH}
        activeCell={activeCell ? { rowIndex: activeCell.rowIndex + 1, columnIndex: activeCell.columnIndex + 1 } : null}
        selections={selections.map(s => ({
            bounds: {
                top: s.bounds.top + 1,
                left: s.bounds.left + 1,
                bottom: s.bounds.bottom + 1,
                right: s.bounds.right + 1
            },
            color: themeStyles.selectionColor
        }))}
        selectionBorderColor={isDark ? '#3b82f6' : '#2563eb'}
        selectionStrokeWidth={2}
        showGridLines={true}
        gridLineColor={themeStyles.gridLineColor}
        itemRenderer={(props) => {
          // Render Headers
          if (props.rowIndex === 0 || props.columnIndex === 0) {
             if (props.rowIndex === 0 && props.columnIndex === 0) {
                 // Corner cell
                 return (
                    <Group>
                        <Rect
                            {...props}
                            fill={themeStyles.headerBgColor}
                            stroke={themeStyles.gridLineColor}
                            strokeWidth={1}
                        />
                    </Group>
                 );
             }
             if (props.rowIndex === 0) {
                 // Column Header (A, B, C...)
                 return (
                     <Group>
                         <Rect
                            {...props}
                            fill={themeStyles.headerBgColor}
                            stroke={themeStyles.gridLineColor}
                            strokeWidth={1}
                         />
                         <Text
                            x={props.x}
                            y={props.y}
                            width={props.width}
                            height={props.height}
                            text={getColumnLabel(props.columnIndex - 1)}
                            align="center"
                            verticalAlign="middle"
                            fill={themeStyles.headerTextColor}
                            fontFamily="Inter, sans-serif"
                            fontSize={12}
                         />
                     </Group>
                 );
             }
             if (props.columnIndex === 0) {
                 // Row Header (1, 2, 3...)
                 return (
                     <Group>
                         <Rect
                            {...props}
                            fill={themeStyles.headerBgColor}
                            stroke={themeStyles.gridLineColor}
                            strokeWidth={1}
                         />
                         <Text
                            x={props.x}
                            y={props.y}
                            width={props.width}
                            height={props.height}
                            text={String(props.rowIndex)}
                            align="center"
                            verticalAlign="middle"
                            fill={themeStyles.headerTextColor}
                            fontFamily="Inter, sans-serif"
                            fontSize={12}
                         />
                     </Group>
                 );
             }
          }

          // Data Cells
          const dataRow = props.rowIndex - 1;
          const dataCol = props.columnIndex - 1;
          const rawValue = data[props.rowIndex - 1]?.[props.columnIndex - 1];
          const cellType = detectCellType(rawValue);
          
          // Style
          const key = cellKey(dataRow, dataCol);
          const cellMapData = doc?.getMap('cells').get(key) as any;
          const style = cellMapData?.style || {};
          const fontStyle = `${style.bold ? 'bold ' : ''}${style.italic ? 'italic' : ''}`.trim() || 'normal';

          if (cellType === 'boolean') {
             const isChecked = rawValue === true || rawValue === 'true' || rawValue === 'TRUE';
             return (
                <Group>
                   <Rect {...props} fill={themeStyles.backgroundColor} stroke={themeStyles.gridLineColor} strokeWidth={1} />
                   <Group x={(props.x || 0) + ((props.width || 0) - 16) / 2} y={(props.y || 0) + ((props.height || 0) - 16) / 2}>
                       <Rect
                           width={16}
                           height={16}
                           cornerRadius={4}
                           stroke={isDark ? '#9ca3af' : '#4b5563'}
                           strokeWidth={1.5}
                           fill={isChecked ? (isDark ? '#3b82f6' : '#2563eb') : 'transparent'}
                       />
                       {isChecked && (
                            <Path
                                data="M4 8l2.5 2.5 5.5 -5.5"
                                stroke="white"
                                strokeWidth={2}
                                lineCap="round"
                                lineJoin="round"
                            />
                       )}
                   </Group>
                </Group>
             );
          }

          return (
            <Cell
              {...props}
              value={rawValue ?? ''}
              fill={themeStyles.backgroundColor}
              textColor={themeStyles.color}
              align={cellType === 'number' ? 'right' : 'left'}
              fontStyle={fontStyle}
              padding={8}
            />
          );
        }}
        stageProps={{
          ref: stageRef,
          onMouseDown: handleMouseDown,
          onMouseMove: handleMouseMove,
          onMouseUp: handleMouseUp,
          onDblClick: (e: any) => {
            const stage = e.target.getStage();
            if (!stage) return;
            const pos = stage.getPointerPosition();
            if (!pos) return;
            
            let cx = -1;
            let ry = -1;
            
            const x = pos.x;
            const y = pos.y;
             
            if (x < HEADER_COLUMN_WIDTH) cx = 0;
            else cx = Math.floor((x - HEADER_COLUMN_WIDTH) / DEFAULT_COLUMN_WIDTH) + 1;
            
            if (y < HEADER_ROW_HEIGHT) ry = 0;
            else ry = Math.floor((y - HEADER_ROW_HEIGHT) / ROW_HEIGHT) + 1;

            if (ry > 0 && cx > 0 && ry <= rows && cx <= columns) {
                 handleCellDoubleClick(ry, cx);
            }
          },
        }}
      />

      {isEditing && activeCell && activeCellBounds && (
        <CellEditor
          cell={{
            row: activeCell.rowIndex,
            col: activeCell.columnIndex,
          }}
          bounds={{
            x: activeCellBounds.x,
            y: activeCellBounds.y,
            width: activeCellBounds.width,
            height: activeCellBounds.height,
          }}
          value={editValue}
          format={{
              // Infer format from cell data if available
             align: detectCellType(editValue) === 'number' ? 'right' : 'left'
          }}
          onChange={setEditValue}
          onCommit={() => {
            updateCell(activeCell.rowIndex, activeCell.columnIndex, editValue);
            setIsEditing(false);
          }}
          onCancel={() => {
            setIsEditing(false);
            setEditValue('');
          }}
          onCellReferenceMode={setIsPickingReference}
        />
      )}
    </div>
    </div>
  );
}
