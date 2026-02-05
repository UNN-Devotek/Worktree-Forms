/**
 * Formula Syntax Highlighting Utility
 *
 * Parses Excel-like formulas and extracts cell/range references with color coding
 * Similar to Excel and Google Sheets highlighting
 */

// Colors for highlighting different cell references (Excel-style)
export const REFERENCE_COLORS = [
  { border: '#4285F4', bg: 'rgba(66, 133, 244, 0.1)' }, // Blue
  { border: '#EA4335', bg: 'rgba(234, 67, 53, 0.1)' },  // Red
  { border: '#34A853', bg: 'rgba(52, 168, 83, 0.1)' },  // Green
  { border: '#FBBC04', bg: 'rgba(251, 188, 4, 0.1)' },  // Yellow
  { border: '#FF6D01', bg: 'rgba(255, 109, 1, 0.1)' },  // Orange
  { border: '#46BDC6', bg: 'rgba(70, 189, 198, 0.1)' }, // Cyan
  { border: '#7B1FA2', bg: 'rgba(123, 31, 162, 0.1)' }, // Purple
  { border: '#E91E63', bg: 'rgba(233, 30, 99, 0.1)' },  // Pink
];

export interface CellReference {
  text: string;          // e.g., "A1", "B2:C5"
  start: number;         // Start position in formula string
  end: number;           // End position in formula string
  colorIndex: number;    // Index into REFERENCE_COLORS
  cells: Array<{ row: number; col: number }>; // Parsed cell positions
}

export interface ParsedFormula {
  original: string;
  references: CellReference[];
}

// Regex patterns for cell references
const CELL_REF_PATTERN = /\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?/g;
const SINGLE_CELL_PATTERN = /^(\$?)([A-Z]+)(\$?)(\d+)$/;
const RANGE_PATTERN = /^(\$?[A-Z]+\$?\d+):(\$?[A-Z]+\$?\d+)$/;

/**
 * Convert column letter to index (A=0, B=1, Z=25, AA=26, etc.)
 */
export function columnToIndex(col: string): number {
  col = col.replace('$', ''); // Remove absolute reference marker
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result - 1;
}

/**
 * Parse a single cell reference (e.g., "A1", "$B$2")
 */
function parseSingleCell(ref: string): { row: number; col: number } | null {
  const match = ref.match(SINGLE_CELL_PATTERN);
  if (!match) return null;

  const [, , colLetter, , rowNum] = match;
  return {
    row: parseInt(rowNum) - 1,
    col: columnToIndex(colLetter),
  };
}

/**
 * Parse a range reference (e.g., "A1:B5")
 */
function parseRange(ref: string): Array<{ row: number; col: number }> {
  const match = ref.match(RANGE_PATTERN);
  if (!match) {
    // Try as single cell
    const cell = parseSingleCell(ref);
    return cell ? [cell] : [];
  }

  const [, start, end] = match;
  const startCell = parseSingleCell(start);
  const endCell = parseSingleCell(end);

  if (!startCell || !endCell) return [];

  // Generate all cells in the range
  const cells: Array<{ row: number; col: number }> = [];
  const minRow = Math.min(startCell.row, endCell.row);
  const maxRow = Math.max(startCell.row, endCell.row);
  const minCol = Math.min(startCell.col, endCell.col);
  const maxCol = Math.max(startCell.col, endCell.col);

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      cells.push({ row, col });
    }
  }

  return cells;
}

/**
 * Parse formula and extract all cell references with colors
 */
export function parseFormula(formula: string): ParsedFormula {
  if (!formula || !formula.startsWith('=')) {
    return { original: formula, references: [] };
  }

  const references: CellReference[] = [];
  let match: RegExpExecArray | null;
  let colorIndex = 0;

  // Reset regex state
  CELL_REF_PATTERN.lastIndex = 0;

  while ((match = CELL_REF_PATTERN.exec(formula)) !== null) {
    const refText = match[0];
    const cells = parseRange(refText);

    if (cells.length > 0) {
      references.push({
        text: refText,
        start: match.index,
        end: match.index + refText.length,
        colorIndex: colorIndex % REFERENCE_COLORS.length,
        cells,
      });
      colorIndex++;
    }
  }

  return {
    original: formula,
    references,
  };
}

/**
 * Generate HTML with syntax-highlighted formula
 */
export function highlightFormula(formula: string): string {
  const parsed = parseFormula(formula);
  if (parsed.references.length === 0) {
    return formula;
  }

  let result = '';
  let lastIndex = 0;

  for (const ref of parsed.references) {
    // Add text before reference
    result += formula.substring(lastIndex, ref.start);

    // Add colored reference
    const color = REFERENCE_COLORS[ref.colorIndex];
    result += `<span style="color: ${color.border}; font-weight: 600;">${ref.text}</span>`;

    lastIndex = ref.end;
  }

  // Add remaining text
  result += formula.substring(lastIndex);

  return result;
}
