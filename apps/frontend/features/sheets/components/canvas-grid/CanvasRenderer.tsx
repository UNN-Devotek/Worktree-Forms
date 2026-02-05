'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  CellData,
  CellFormat,
  ColumnConfig,
  MergeRange,
  Cell,
  CellRange,
  CellBounds,
  Viewport,
  ROW_HEIGHT,
  DEFAULT_FONT,
  cellKey,
  getColumnLabel,
} from './types';
import { ThemeColors } from './hooks/useThemeColors';
import { FormulaEngineAPI, formatErrorCode } from './hooks/useFormulaEngine';
import { ParsedFormula, REFERENCE_COLORS } from './utils/formulaHighlighter';

interface CanvasRendererProps {
  cells: Map<string, CellData>;
  formats: Map<string, CellFormat>;
  columns: ColumnConfig[];
  mergedCells: Map<string, MergeRange>;
  viewport: Viewport;
  activeCell: Cell | null;
  selection: CellRange | null;
  copiedRange: CellRange | null;
  parsedFormula: ParsedFormula | null;
  width: number;
  height: number;
  onCellClick?: (cell: Cell) => void;
  onCellDoubleClick?: (cell: Cell) => void;
  onSelectionChange?: (selection: CellRange | null) => void;
  themeColors: ThemeColors;
  formulaEngine: FormulaEngineAPI;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  cells,
  formats,
  columns,
  mergedCells,
  viewport,
  activeCell,
  selection,
  copiedRange,
  parsedFormula,
  width,
  height,
  onCellClick,
  onCellDoubleClick,
  onSelectionChange,
  themeColors,
  formulaEngine,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Cell | null>(null);
  const didDragRef = useRef(false); // Track if we just finished dragging

  // Helper function to get cell from mouse coordinates
  const getCellFromCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Cell | null => {
    if (!canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + viewport.scrollX;
    const y = e.clientY - rect.top + viewport.scrollY;

    // Find clicked row
    const row = Math.floor(y / ROW_HEIGHT);

    // Find clicked column
    let col = 0;
    let colX = 0;
    for (let i = 0; i < columns.length; i++) {
      if (colX + columns[i].width > x) {
        col = i;
        break;
      }
      colX += columns[i].width;
    }

    return { row, col };
  };

  // Handle mouse down - start drag selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromCoordinates(e);
    if (!cell) return;

    setIsDragging(true);
    setDragStart(cell);
    didDragRef.current = false; // Reset drag flag

    // Set active cell on mouse down
    if (onCellClick) {
      onCellClick(cell);
    }
  };

  // Handle mouse move - update selection during drag
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !onSelectionChange) return;

    const cell = getCellFromCoordinates(e);
    if (!cell) return;

    // Check if we've moved to a different cell (actual drag)
    if (cell.row !== dragStart.row || cell.col !== dragStart.col) {
      didDragRef.current = true; // Mark that we actually dragged
    }

    // Create selection range from drag start to current cell
    const selection: CellRange = {
      startRow: Math.min(dragStart.row, cell.row),
      startCol: Math.min(dragStart.col, cell.col),
      endRow: Math.max(dragStart.row, cell.row),
      endCol: Math.max(dragStart.col, cell.col),
    };

    onSelectionChange(selection);
  };

  // Handle mouse up - end drag selection
  const handleMouseUp = () => {
    if (isDragging && didDragRef.current) {
      console.log('✅ Selection drag completed, maintaining selection');
    }
    setIsDragging(false);
  };

  // Handle mouse click to select cell (only fires if not dragging)
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCellClick) return;

    const cell = getCellFromCoordinates(e);
    if (!cell) return;

    // If we just finished dragging, don't clear the selection
    // Otherwise, clear selection on single click
    if (onSelectionChange && !didDragRef.current) {
      onSelectionChange(null);
    }
  };

  // Handle mouse double-click to enter edit mode
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onCellDoubleClick) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + viewport.scrollX;
    const y = e.clientY - rect.top + viewport.scrollY;

    // Find clicked row
    const row = Math.floor(y / ROW_HEIGHT);

    // Find clicked column
    let col = 0;
    let colX = 0;
    for (let i = 0; i < columns.length; i++) {
      if (colX + columns[i].width > x) {
        col = i;
        break;
      }
      colX += columns[i].width;
    }

    onCellDoubleClick({ row, col });
  };

  // Main rendering effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate visible range (virtual scrolling)
    const startRow = Math.floor(viewport.scrollY / ROW_HEIGHT);
    const endRow = Math.min(
      startRow + Math.ceil(viewport.height / ROW_HEIGHT) + 1,
      1000 // Max rows for now
    );

    let startCol = 0;
    let endCol = columns.length;
    let colX = 0;
    for (let i = 0; i < columns.length; i++) {
      if (colX >= viewport.scrollX && startCol === 0) {
        startCol = i;
      }
      if (colX > viewport.scrollX + viewport.width) {
        endCol = i;
        break;
      }
      colX += columns[i].width;
    }

    // Render visible cells
    for (let row = startRow; row < endRow; row++) {
      let x = 0;

      for (let col = 0; col < columns.length; col++) {
        const column = columns[col];

        // Skip if part of merged cell (render only top-left)
        if (isPartOfMerge(row, col, mergedCells) && !isMergeTopLeft(row, col, mergedCells)) {
          x += column.width;
          continue;
        }

        const key = cellKey(row, col);
        const cellData = cells.get(key);
        const format = formats.get(key);
        const bounds = getCellBounds(row, col, columns, mergedCells);

        drawCell(ctx, cellData, format, bounds, viewport, row, col, themeColors, formulaEngine);

        x += column.width;
      }
    }

    // Draw selection
    if (selection) {
      drawSelection(ctx, selection, columns, viewport, themeColors);
    }

    // Draw active cell border
    if (activeCell) {
      drawActiveCell(ctx, activeCell, columns, viewport, themeColors);
    }

    // Draw copied range border (Excel-style dashed border)
    if (copiedRange) {
      drawCopiedRange(ctx, copiedRange, columns, viewport);
    }

    // Draw formula reference highlighting (Excel/Google Sheets-style colored borders)
    if (parsedFormula) {
      drawFormulaReferences(ctx, parsedFormula, columns, viewport);
    }
  }, [cells, formats, columns, mergedCells, viewport, activeCell, selection, copiedRange, parsedFormula, width, height, themeColors, formulaEngine]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // End drag if mouse leaves canvas
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        display: 'block',
        width: `${width}px`,
        height: `${height}px`,
        cursor: isDragging ? 'crosshair' : 'cell',
      }}
      data-grid="canvas"
    />
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

function drawCell(
  ctx: CanvasRenderingContext2D,
  cellData: CellData | undefined,
  format: CellFormat | undefined,
  bounds: CellBounds,
  viewport: Viewport,
  row: number,
  col: number,
  themeColors: ThemeColors,
  formulaEngine: FormulaEngineAPI
) {
  const x = bounds.x - viewport.scrollX;
  const y = bounds.y - viewport.scrollY;

  // Check if cell has an error
  const hasError = formulaEngine.isError(row, col);
  const errorCode = hasError ? formulaEngine.getError(row, col) : null;

  // Background - use theme color
  ctx.fillStyle = format?.bgColor || themeColors.cellBg;
  ctx.fillRect(x, y, bounds.width, bounds.height);

  // Add red tint for errors (semi-transparent overlay)
  if (hasError) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // red tint overlay for errors
    ctx.fillRect(x, y, bounds.width, bounds.height);
  }

  // Borders
  if (format?.border) {
    drawBorders(ctx, format.border, x, y, bounds.width, bounds.height);
  }

  // Grid lines (default) - use theme color
  ctx.strokeStyle = themeColors.gridLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, bounds.width, bounds.height);

  // Text - show either computed value, error code, or raw value
  const shouldShowText = cellData?.value != null || cellData?.formula != null || hasError;

  if (shouldShowText) {
    const font = format?.font || DEFAULT_FONT;

    // Use red for errors (works in both light and dark), theme color otherwise
    if (hasError) {
      ctx.fillStyle = '#ef4444'; // vibrant red text for errors (works in both themes)
    } else {
      ctx.fillStyle = format?.color || themeColors.cellText;
    }

    ctx.font = `${font.bold ? 'bold ' : ''}${font.italic ? 'italic ' : ''}${font.size}px ${font.family}`;
    ctx.textAlign = format?.align || 'left';
    ctx.textBaseline = format?.vAlign || 'middle';

    const padding = 8;
    let textX = x + padding;

    if (format?.align === 'right') {
      textX = x + bounds.width - padding;
    } else if (format?.align === 'center') {
      textX = x + bounds.width / 2;
    }

    const textY = y + bounds.height / 2;

    // Get display text (computed value for formulas, error code for errors)
    const text = formatCellValue(cellData, row, col, formulaEngine);
    const maxWidth = bounds.width - padding * 2;
    ctx.fillText(text, textX, textY, maxWidth);
  }
}

function drawBorders(
  ctx: CanvasRenderingContext2D,
  border: NonNullable<CellFormat['border']>,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (border.top) {
    ctx.strokeStyle = border.top.color;
    ctx.lineWidth = border.top.width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
  }

  if (border.right) {
    ctx.strokeStyle = border.right.color;
    ctx.lineWidth = border.right.width;
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
  }

  if (border.bottom) {
    ctx.strokeStyle = border.bottom.color;
    ctx.lineWidth = border.bottom.width;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
  }

  if (border.left) {
    ctx.strokeStyle = border.left.color;
    ctx.lineWidth = border.left.width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
  }
}

function drawSelection(
  ctx: CanvasRenderingContext2D,
  selection: CellRange,
  columns: ColumnConfig[],
  viewport: Viewport,
  themeColors: ThemeColors
) {
  const startX = getColumnX(selection.startCol, columns) - viewport.scrollX;
  const startY = selection.startRow * ROW_HEIGHT - viewport.scrollY;

  const endX = getColumnX(selection.endCol + 1, columns) - viewport.scrollX;
  const endY = (selection.endRow + 1) * ROW_HEIGHT - viewport.scrollY;

  const width = endX - startX;
  const height = endY - startY;

  // Draw selection background - use theme-aware primary color
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Primary color with opacity
  ctx.fillRect(startX, startY, width, height);

  // Draw selection border - use theme color
  ctx.strokeStyle = themeColors.selectedBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, width, height);
}

function drawActiveCell(
  ctx: CanvasRenderingContext2D,
  activeCell: Cell,
  columns: ColumnConfig[],
  viewport: Viewport,
  themeColors: ThemeColors
) {
  const x = getColumnX(activeCell.col, columns) - viewport.scrollX;
  const y = activeCell.row * ROW_HEIGHT - viewport.scrollY;
  const width = columns[activeCell.col]?.width || 120;
  const height = ROW_HEIGHT;

  // Draw thick border - use theme color
  ctx.strokeStyle = themeColors.selectedBorder;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);
}

function drawCopiedRange(
  ctx: CanvasRenderingContext2D,
  copiedRange: CellRange,
  columns: ColumnConfig[],
  viewport: Viewport
) {
  const startX = getColumnX(copiedRange.startCol, columns) - viewport.scrollX;
  const startY = copiedRange.startRow * ROW_HEIGHT - viewport.scrollY;

  const endX = getColumnX(copiedRange.endCol + 1, columns) - viewport.scrollX;
  const endY = (copiedRange.endRow + 1) * ROW_HEIGHT - viewport.scrollY;

  const width = endX - startX;
  const height = endY - startY;

  // Log drawing info
  console.log(`🎨 Drawing dashed border: x=${startX}, y=${startY}, width=${width}, height=${height}, range=${getColumnLabel(copiedRange.startCol)}${copiedRange.startRow + 1}:${getColumnLabel(copiedRange.endCol)}${copiedRange.endRow + 1}`);

  // Draw dashed border (Excel-style "marching ants")
  ctx.strokeStyle = '#1a73e8'; // Blue color for copied range
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]); // Dashed line pattern
  ctx.strokeRect(startX, startY, width, height);
  ctx.setLineDash([]); // Reset to solid line
}

function drawFormulaReferences(
  ctx: CanvasRenderingContext2D,
  parsedFormula: ParsedFormula,
  columns: ColumnConfig[],
  viewport: Viewport
) {
  // Draw colored borders around cells referenced in formula (Excel/Google Sheets-style)
  parsedFormula.references.forEach((reference) => {
    const color = REFERENCE_COLORS[reference.colorIndex];

    // For each cell in the reference, draw a colored border
    reference.cells.forEach((cell) => {
      const x = getColumnX(cell.col, columns) - viewport.scrollX;
      const y = cell.row * ROW_HEIGHT - viewport.scrollY;
      const width = columns[cell.col]?.width || 120;
      const height = ROW_HEIGHT;

      // Fill with semi-transparent background color
      ctx.fillStyle = color.bg;
      ctx.fillRect(x, y, width, height);

      // Draw thick colored border
      ctx.strokeStyle = color.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    });

    // If reference is a range (multiple cells), draw an outline around the entire range
    if (reference.cells.length > 1) {
      const minRow = Math.min(...reference.cells.map(c => c.row));
      const maxRow = Math.max(...reference.cells.map(c => c.row));
      const minCol = Math.min(...reference.cells.map(c => c.col));
      const maxCol = Math.max(...reference.cells.map(c => c.col));

      const startX = getColumnX(minCol, columns) - viewport.scrollX;
      const startY = minRow * ROW_HEIGHT - viewport.scrollY;
      const endX = getColumnX(maxCol + 1, columns) - viewport.scrollX;
      const endY = (maxRow + 1) * ROW_HEIGHT - viewport.scrollY;

      const rangeWidth = endX - startX;
      const rangeHeight = endY - startY;

      // Draw thicker border around entire range
      ctx.strokeStyle = color.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(startX, startY, rangeWidth, rangeHeight);
    }
  });
}

function getCellBounds(
  row: number,
  col: number,
  columns: ColumnConfig[],
  mergedCells: Map<string, MergeRange>
): CellBounds {
  // Check if cell is part of a merged range
  const merge = findMergeRange(row, col, mergedCells);

  if (merge) {
    const x = getColumnX(merge.startCol, columns);
    const y = merge.startRow * ROW_HEIGHT;
    const width = getColumnX(merge.endCol + 1, columns) - x;
    const height = (merge.endRow - merge.startRow + 1) * ROW_HEIGHT;

    return { x, y, width, height };
  }

  // Normal cell
  const x = getColumnX(col, columns);
  const y = row * ROW_HEIGHT;
  const width = columns[col]?.width || 120;
  const height = ROW_HEIGHT;

  return { x, y, width, height };
}

function getColumnX(colIndex: number, columns: ColumnConfig[]): number {
  let x = 0;
  for (let i = 0; i < colIndex && i < columns.length; i++) {
    x += columns[i].width;
  }
  return x;
}

function formatCellValue(
  cell: CellData | undefined,
  row: number,
  col: number,
  formulaEngine: FormulaEngineAPI
): string {
  // If no cell data and no formula, return empty
  if (!cell) return '';

  // Check if cell has an error
  if (formulaEngine.isError(row, col)) {
    const error = formulaEngine.getError(row, col);
    if (error) {
      return formatErrorCode(error);
    }
  }

  // For formulas, get computed value from HyperFormula
  if (cell.type === 'FORMULA' || cell.formula) {
    const computedValue = formulaEngine.getCellValue(row, col);

    // Handle different computed value types
    if (computedValue === null || computedValue === undefined) {
      return '';
    }

    if (typeof computedValue === 'number') {
      return computedValue.toLocaleString();
    }

    if (typeof computedValue === 'boolean') {
      return computedValue ? 'TRUE' : 'FALSE';
    }

    return String(computedValue);
  }

  // For non-formula cells, show raw value
  if (cell.value == null) return '';

  if (cell.type === 'NUMBER') {
    return typeof cell.value === 'number' ? cell.value.toLocaleString() : String(cell.value);
  }

  if (cell.type === 'BOOLEAN') {
    return cell.value ? 'TRUE' : 'FALSE';
  }

  return String(cell.value);
}

function isPartOfMerge(
  row: number,
  col: number,
  mergedCells: Map<string, MergeRange>
): boolean {
  for (const merge of mergedCells.values()) {
    if (
      row >= merge.startRow &&
      row <= merge.endRow &&
      col >= merge.startCol &&
      col <= merge.endCol
    ) {
      return true;
    }
  }
  return false;
}

function isMergeTopLeft(
  row: number,
  col: number,
  mergedCells: Map<string, MergeRange>
): boolean {
  for (const merge of mergedCells.values()) {
    if (row === merge.startRow && col === merge.startCol) {
      return true;
    }
  }
  return false;
}

function findMergeRange(
  row: number,
  col: number,
  mergedCells: Map<string, MergeRange>
): MergeRange | null {
  for (const merge of mergedCells.values()) {
    if (
      row >= merge.startRow &&
      row <= merge.endRow &&
      col >= merge.startCol &&
      col <= merge.endCol
    ) {
      return merge;
    }
  }
  return null;
}
