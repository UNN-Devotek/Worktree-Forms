import { describe, it, expect } from 'vitest';
import { detectActiveSignature, FUNCTION_SIGNATURES } from './formula-signatures';

// ---------------------------------------------------------------------------
// FUNCTION_SIGNATURES catalogue
// ---------------------------------------------------------------------------

describe('FUNCTION_SIGNATURES', () => {
  it('[P0] contains core math functions', () => {
    expect(FUNCTION_SIGNATURES['SUM']).toBeDefined();
    expect(FUNCTION_SIGNATURES['AVERAGE']).toBeDefined();
    expect(FUNCTION_SIGNATURES['MIN']).toBeDefined();
    expect(FUNCTION_SIGNATURES['MAX']).toBeDefined();
    expect(FUNCTION_SIGNATURES['COUNT']).toBeDefined();
  });

  it('[P0] contains core logical functions', () => {
    expect(FUNCTION_SIGNATURES['IF']).toBeDefined();
    expect(FUNCTION_SIGNATURES['AND']).toBeDefined();
    expect(FUNCTION_SIGNATURES['OR']).toBeDefined();
    expect(FUNCTION_SIGNATURES['IFERROR']).toBeDefined();
  });

  it('[P0] contains core text functions', () => {
    expect(FUNCTION_SIGNATURES['UPPER']).toBeDefined();
    expect(FUNCTION_SIGNATURES['LOWER']).toBeDefined();
    expect(FUNCTION_SIGNATURES['LEN']).toBeDefined();
    expect(FUNCTION_SIGNATURES['TRIM']).toBeDefined();
    expect(FUNCTION_SIGNATURES['CONCAT']).toBeDefined();
  });

  it('[P0] contains date functions', () => {
    expect(FUNCTION_SIGNATURES['TODAY']).toBeDefined();
    expect(FUNCTION_SIGNATURES['NOW']).toBeDefined();
    expect(FUNCTION_SIGNATURES['DATE']).toBeDefined();
  });

  it('[P0] every signature has a description and args array', () => {
    Object.entries(FUNCTION_SIGNATURES).forEach(([name, sig]) => {
      expect(sig.description, `${name} missing description`).toBeTruthy();
      expect(Array.isArray(sig.args), `${name} args not array`).toBe(true);
    });
  });

  it('[P1] functions with no args have empty args array', () => {
    expect(FUNCTION_SIGNATURES['TODAY'].args).toHaveLength(0);
    expect(FUNCTION_SIGNATURES['NOW'].args).toHaveLength(0);
  });

  it('[P1] required args are marked required: true', () => {
    const sumArgs = FUNCTION_SIGNATURES['SUM'].args;
    expect(sumArgs[0].required).toBe(true);
  });

  it('[P1] optional args are marked required: false', () => {
    const sumArgs = FUNCTION_SIGNATURES['SUM'].args;
    // second arg is optional vararg
    expect(sumArgs[1].required).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectActiveSignature
// ---------------------------------------------------------------------------

describe('detectActiveSignature', () => {
  // ─── Non-formula strings ────────────────────────────────────────────────

  it('[P0] returns null for plain text (no leading =)', () => {
    expect(detectActiveSignature('SUM(A1, A2)', 10)).toBeNull();
  });

  it('[P0] returns null for empty string', () => {
    expect(detectActiveSignature('', 0)).toBeNull();
  });

  it('[P0] returns null when formula has no open paren yet', () => {
    expect(detectActiveSignature('=SUM', 4)).toBeNull();
  });

  it('[P0] returns null for unknown function name', () => {
    expect(detectActiveSignature('=FOOBAR(', 8)).toBeNull();
  });

  // ─── Basic function detection ────────────────────────────────────────────

  it('[P0] detects SUM at first argument (argIndex 0)', () => {
    const result = detectActiveSignature('=SUM(', 5);
    expect(result).not.toBeNull();
    expect(result?.fnName).toBe('SUM');
    expect(result?.argIndex).toBe(0);
  });

  it('[P0] detects AVERAGE inside the call', () => {
    const result = detectActiveSignature('=AVERAGE(A1', 11);
    expect(result?.fnName).toBe('AVERAGE');
    expect(result?.argIndex).toBe(0);
  });

  it('[P0] argIndex increments on each comma', () => {
    // =IF(cond, val_true,   ← cursor after second comma
    const formula = '=IF(cond, val_true, ';
    const result = detectActiveSignature(formula, formula.length);
    expect(result?.fnName).toBe('IF');
    expect(result?.argIndex).toBe(2);
  });

  it('[P0] argIndex is 1 after first comma', () => {
    const formula = '=SUM(A1, ';
    const result = detectActiveSignature(formula, formula.length);
    expect(result?.fnName).toBe('SUM');
    expect(result?.argIndex).toBe(1);
  });

  // ─── Case insensitivity ────────────────────────────────────────────────

  it('[P1] function name is case-insensitive (lowercase input)', () => {
    const result = detectActiveSignature('=sum(', 5);
    expect(result?.fnName).toBe('SUM');
  });

  it('[P1] mixed case function name is detected', () => {
    const result = detectActiveSignature('=Average(', 9);
    expect(result?.fnName).toBe('AVERAGE');
  });

  // ─── Nested parentheses ──────────────────────────────────────────────────

  it('[P1] commas inside nested parens do not increment outer argIndex', () => {
    // =IF(SUM(a, b), value_true,
    //                           ^ cursor at second comma of outer IF
    const formula = '=IF(SUM(a, b), value_true, ';
    const result = detectActiveSignature(formula, formula.length);
    expect(result?.fnName).toBe('IF');
    expect(result?.argIndex).toBe(2);
  });

  it('[P1] detects inner function when cursor is inside nested call', () => {
    // =IF(SUM(a,   ← cursor inside SUM
    const formula = '=IF(SUM(a, ';
    const result = detectActiveSignature(formula, formula.length);
    expect(result?.fnName).toBe('SUM');
    expect(result?.argIndex).toBe(1);
  });

  // ─── Closed paren — outside call ────────────────────────────────────────

  it('[P1] returns null when cursor is after the closing paren', () => {
    // =SUM(A1, A2)   ← cursor after )
    const formula = '=SUM(A1, A2)';
    const result = detectActiveSignature(formula, formula.length);
    // All parens are matched, no unmatched open paren
    expect(result).toBeNull();
  });
});
