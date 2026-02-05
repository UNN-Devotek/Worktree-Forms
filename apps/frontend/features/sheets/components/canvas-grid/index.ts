/**
 * Canvas Grid - Custom spreadsheet implementation
 *
 * Phase 1: Basic canvas rendering with cell display and selection
 * Phase 2: Keyboard navigation, cell editing, copy/paste, accessibility
 */

export { CanvasGrid } from './CanvasGrid';
export type { CanvasGridRef } from './CanvasGrid';
export { CanvasRenderer } from './CanvasRenderer';
export { CellEditor } from './CellEditor';
export { AccessibleTable } from './AccessibleTable';
export { useGridKeyboard } from './hooks/useGridKeyboard';
export { useClipboard } from './hooks/useClipboard';
export { useThemeColors } from './hooks/useThemeColors';
export { useBenchmark } from './hooks/useBenchmark';
export { useFormulaEngine, formatErrorCode, isFormula } from './hooks/useFormulaEngine';
export type { FormulaEngineAPI } from './hooks/useFormulaEngine';
export * from './types';
export * from './utils/benchmark';
