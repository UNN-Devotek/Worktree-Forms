/**
 * TypeScript types for custom canvas-based spreadsheet grid
 *
 * This defines the unified data model that works seamlessly with:
 * - Yjs CRDT for real-time collaboration
 * - Canvas rendering engine
 * - PostgreSQL persistence
 */

// ============================================================================
// Cell Data Types
// ============================================================================

export type CellType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'FORMULA';

export interface CellData {
  value: string | number | boolean | null;
  formula?: string;        // e.g., "=SUM(A1:A10)"
  type: CellType;
}

// ============================================================================
// Cell Formatting Types
// ============================================================================

export interface CellFormat {
  font?: {
    family: string;        // e.g., "Inter", "Arial"
    size: number;          // pixels, e.g., 13
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  color?: string;          // Text color (hex), e.g., "#000000"
  bgColor?: string;        // Background color (hex), e.g., "#ffffff"
  border?: {
    top?: BorderStyle;
    right?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
  };
  align?: 'left' | 'center' | 'right';
  vAlign?: 'top' | 'middle' | 'bottom';
}

export interface BorderStyle {
  width: number;           // pixels, e.g., 1
  color: string;           // hex color, e.g., "#e5e7eb"
  style: 'solid' | 'dashed' | 'dotted';
}

// ============================================================================
// Column Configuration
// ============================================================================

export interface ColumnConfig {
  id: string;              // 'A', 'B', 'C', ... or custom IDs
  header: string;          // Display name
  width: number;           // pixels
  hidden?: boolean;
  locked?: boolean;        // Prevent editing
}

// ============================================================================
// Merged Cells
// ============================================================================

export interface MergeRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

// ============================================================================
// Selection & Navigation
// ============================================================================

export interface Cell {
  row: number;
  col: number;
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

// ============================================================================
// Rendering Types
// ============================================================================

export interface CellBounds {
  x: number;               // Canvas x coordinate
  y: number;               // Canvas y coordinate
  width: number;           // Cell width in pixels
  height: number;          // Cell height in pixels
}

export interface Viewport {
  scrollX: number;         // Horizontal scroll offset
  scrollY: number;         // Vertical scroll offset
  width: number;           // Viewport width
  height: number;          // Viewport height
}

// ============================================================================
// Grid State Types
// ============================================================================

export type GridMode = 'NAVIGATION' | 'EDITING' | 'SELECTING';

export interface GridState {
  mode: GridMode;
  activeCell: Cell | null;
  selection: CellRange | null;
  editingValue: string | null;
}

// ============================================================================
// Collaboration Types (Yjs Awareness)
// ============================================================================

export interface UserCursor {
  row: number;
  col: number;
  user: {
    name: string;
    color: string;         // hex color for cursor
  };
}

export interface EditingCell {
  row: number;
  col: number;
}

// ============================================================================
// Performance Metrics
// ============================================================================

export interface PerformanceMetrics {
  fps: number;
  renderTime: number;      // milliseconds
  cellCount: number;
  memoryUsage: number;     // MB
}

// ============================================================================
// Utility Functions (Type Guards)
// ============================================================================

export function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function parseCellKey(key: string): Cell {
  const [row, col] = key.split(':').map(Number);
  return { row, col };
}

export function getColumnLabel(colIndex: number): string {
  let label = '';
  let col = colIndex;

  while (col >= 0) {
    label = String.fromCharCode(65 + (col % 26)) + label;
    col = Math.floor(col / 26) - 1;
  }

  return label;
}

export function parseColumnLabel(label: string): number {
  let col = 0;
  for (let i = 0; i < label.length; i++) {
    col = col * 26 + (label.charCodeAt(i) - 64);
  }
  return col - 1;
}

export function isCellInRange(cell: Cell, range: CellRange): boolean {
  return (
    cell.row >= range.startRow &&
    cell.row <= range.endRow &&
    cell.col >= range.startCol &&
    cell.col <= range.endCol
  );
}

export function detectType(value: any): CellType {
  if (value == null) return 'TEXT';
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'number') return 'NUMBER';
  if (typeof value === 'string') {
    if (value.startsWith('=')) return 'FORMULA';
    if (!isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}/.test(value)) return 'DATE';
  }
  return 'TEXT';
}

// ============================================================================
// Constants
// ============================================================================

export const ROW_HEIGHT = 32; // pixels
export const MIN_COLUMN_WIDTH = 60; // pixels
export const DEFAULT_COLUMN_WIDTH = 120; // pixels
export const MAX_ROWS = 100000;
export const MAX_COLS = 26; // A-Z

export const DEFAULT_FONT: CellFormat['font'] = {
  family: 'Inter, system-ui, sans-serif',
  size: 13,
  bold: false,
  italic: false,
};

// Default colors (light mode fallback - actual colors come from useThemeColors)
export const DEFAULT_COLORS = {
  gridLine: '#e5e7eb',
  cellBg: '#ffffff',
  cellText: '#000000',
  selectedBorder: '#3b82f6',
  headerBg: '#f9fafb',
  headerText: '#6b7280',
};
