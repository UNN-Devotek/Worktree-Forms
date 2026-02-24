/**
 * Cell styling configuration for Smart Grid cells
 */
export interface CellStyleConfig {
  /** Font family (e.g., 'Arial', 'Inter', 'Roboto') */
  fontFamily?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Font weight */
  fontWeight?: 'normal' | 'bold';
  /** Font style */
  fontStyle?: 'normal' | 'italic';
  /** Text decoration */
  textDecoration?: 'none' | 'underline' | 'line-through';
  /** Horizontal text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Vertical text alignment */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Text color (CSS color value) */
  color?: string;
  /** Cell background color (CSS color value) */
  backgroundColor?: string;
  /** Enable text wrapping */
  wrap?: boolean;
}

/**
 * Filter rule for column filtering
 */
export interface FilterRule {
  id: string;
  columnId: string;
  operator: FilterOperator;
  value: string | number | boolean | null;
  enabled: boolean;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_blank'
  | 'is_not_blank'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal';

/**
 * Conditional formatting rule
 */
export interface ConditionalFormatRule {
  id: string;
  name: string;
  /** Column to evaluate */
  columnId: string;
  /** Condition operator */
  operator: FilterOperator;
  /** Value to compare against */
  value: string | number | boolean | null;
  /** Style to apply when condition is met */
  style: Partial<CellStyleConfig>;
  /** Apply to entire row or just the cell */
  applyToRow: boolean;
  /** Priority (lower = higher priority) */
  priority: number;
  enabled: boolean;
}

/**
 * Highlight changes configuration (local per-user, not synced)
 */
export interface HighlightChangesConfig {
  enabled: boolean;
  /** Duration in ms to look back. 0 = all time. */
  timeMs: number;
  /** Background color applied to changed cells */
  color: string;
}

/**
 * Default cell style
 */
export const DEFAULT_CELL_STYLE: CellStyleConfig = {
  fontFamily: 'Inter',
  fontSize: 13,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  verticalAlign: 'middle',
  color: undefined,
  backgroundColor: undefined,
  wrap: false,
};
