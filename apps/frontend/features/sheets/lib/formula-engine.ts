/**
 * Story 6-8: Formula Engine Integration
 *
 * Thin wrapper around HyperFormula for evaluating cell formulas in the
 * Smart Grid. HyperFormula is already a project dependency and is used
 * directly in LiveTable and FormulaBar; this module exposes a
 * standalone `evaluateFormula` utility for server-side or utility use
 * where the full SheetProvider HF instance is unavailable.
 *
 * Named-variable substitution allows simple expressions like
 * `={budget}*0.1` where `{budget}` is resolved from the caller-supplied
 * context map before HyperFormula parses the expression.
 */

import { HyperFormula } from 'hyperformula';

// Single shared instance — HF instances are heavy; reuse across calls.
let _hf: HyperFormula | null = null;

function getHF(): HyperFormula {
  if (!_hf) {
    _hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
    // Add a single sheet for scratch evaluation.
    _hf.addSheet('scratch');
  }
  return _hf;
}

export type FormulaContext = Record<string, number | string | boolean | null>;

/**
 * Evaluates a formula expression against a named-variable context.
 *
 * - Non-formula strings (not starting with `=`) are returned as-is.
 * - `{varName}` tokens inside the formula are substituted from `context`
 *   before evaluation.
 * - Returns `'#ERROR'` for any parse or evaluation failures.
 *
 * @param expression - Raw cell value, e.g. `"=SUM({q1},{q2})"` or `"hello"`.
 * @param context    - Map of variable names to their current values.
 */
export function evaluateFormula(
  expression: string,
  context: FormulaContext = {}
): number | string | boolean {
  if (!expression.startsWith('=')) return expression;

  // Substitute named variables before handing to HyperFormula.
  let expr = expression;
  for (const [key, value] of Object.entries(context)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expr = expr.replace(new RegExp(`\\{${escaped}\\}`, 'g'), String(value ?? 0));
  }

  try {
    const hf = getHF();
    const sheetId = hf.getSheetId('scratch');
    if (sheetId === undefined) return '#ERROR';

    // Place the formula in cell A1 of the scratch sheet.
    hf.setCellContents({ sheet: sheetId, row: 0, col: 0 }, [[expr]]);
    const result = hf.getCellValue({ sheet: sheetId, row: 0, col: 0 });

    // Clear the scratch cell so the next call starts clean.
    hf.setCellContents({ sheet: sheetId, row: 0, col: 0 }, [[null]]);

    if (result === null || result === undefined) return '';
    if (typeof result === 'object' && 'type' in result) {
      // HyperFormula error cell — return the error code string.
      return (result as { value: string }).value ?? '#ERROR';
    }
    return result as number | string | boolean;
  } catch {
    return '#ERROR';
  }
}

/**
 * Returns true if the given string is a formula expression.
 */
export function isFormula(value: string): boolean {
  return typeof value === 'string' && value.startsWith('=');
}
