/**
 * Formula Engine Hook - fast-formula-parser Integration
 *
 * Integrates fast-formula-parser (MIT-licensed) for spreadsheet formula evaluation.
 * Syncs Yjs cell data to parser and evaluates formulas.
 * Replaced HyperFormula (GPLv3) to maintain MIT-only licensing.
 */

import { useMemo, useEffect, useCallback, useState } from 'react';
// Vendored import to fix stubborn build (module resolution) errors
// @ts-ignore
import FormulaParser from '@/lib/vendor/fast-formula-parser';
import * as Y from 'yjs';
import { cellKey, parseCellKey } from '../types';

export interface UseFormulaEngineProps {
  yjsDoc: Y.Doc | null;
  maxRows?: number;
  maxCols?: number;
}

export type CellValue = string | number | boolean | null;

export interface FormulaError {
  type: 'DIV_BY_ZERO' | 'REF' | 'VALUE' | 'NAME' | 'NUM' | 'NA' | 'ERROR';
  message: string;
}

export interface FormulaEngineAPI {
  getCellValue: (row: number, col: number) => CellValue;
  isError: (row: number, col: number) => boolean;
  getError: (row: number, col: number) => FormulaError | null;
  recalculate: () => void;
}

/**
 * Hook that manages fast-formula-parser instance and syncs with Yjs cells
 */
export function useFormulaEngine({
  yjsDoc,
  maxRows = 1000,
  maxCols = 26,
}: UseFormulaEngineProps): FormulaEngineAPI {
  // Create FormulaParser instance (MIT-licensed)
  const parser = useMemo(() => new FormulaParser(), []);

  const [syncVersion, setSyncVersion] = useState(0);

  // Get Yjs maps (null-safe)
  const cellsMap = yjsDoc ? yjsDoc.getMap('cells') : null;

  // Build data matrix for parser
  const buildDataMatrix = useCallback(() => {
    const matrix: any[][] = [];

    // Initialize empty grid
    for (let row = 0; row < maxRows; row++) {
      matrix[row] = new Array(maxCols).fill(null);
    }

    // Fill with cell values (not formulas - those are evaluated later)
    if (cellsMap) {
      cellsMap.forEach((cellData: any, key) => {
        const { row, col } = parseCellKey(key);

        if (row >= maxRows || col >= maxCols) return;

        // Store raw value for non-formula cells
        // Formula cells will be evaluated on-demand
        if (!cellData.formula) {
          matrix[row][col] = cellData.value;
        }
      });
    }

    return matrix;
  }, [cellsMap, maxRows, maxCols]);

  // Listen for Yjs changes to trigger recalculation
  useEffect(() => {
    if (!cellsMap) return;

    const handleChange = () => {
      setSyncVersion(v => v + 1);
    };

    cellsMap.observe(handleChange);

    return () => {
      cellsMap.unobserve(handleChange);
    };
  }, [cellsMap]);

  // Get computed cell value (resolves formulas)
  const getCellValue = useCallback((row: number, col: number): CellValue => {
    try {
      if (!cellsMap) return null;

      const key = cellKey(row, col);
      const cellData = cellsMap.get(key) as any;

      if (!cellData) return null;

      // If cell has formula, evaluate it
      if (cellData.formula) {
        try {
          const matrix = buildDataMatrix();
          const result = parser.parse(cellData.formula, {
            row,
            col,
            sheet: matrix
          } as any);

          // fast-formula-parser returns { result, error }
          if (result.error) {
            return `#${result.error}`;
          }

          return result.result;
        } catch (error: any) {
          // Parse error message to determine type
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('div') || msg.includes('zero')) return '#DIV/0!';
          if (msg.includes('ref')) return '#REF!';
          if (msg.includes('name')) return '#NAME?';
          if (msg.includes('value')) return '#VALUE!';
          return '#ERROR!';
        }
      }

      // Return raw value for non-formula cells
      return cellData.value;
    } catch (error) {
      console.error('Error getting cell value:', error);
      return '#ERROR!';
    }
  }, [cellsMap, parser, buildDataMatrix, syncVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if cell contains an error
  const isError = useCallback((row: number, col: number): boolean => {
    const value = getCellValue(row, col);
    return typeof value === 'string' && value.startsWith('#');
  }, [getCellValue]);

  // Get detailed error information
  const getError = useCallback((row: number, col: number): FormulaError | null => {
    const value = getCellValue(row, col);
    if (typeof value !== 'string' || !value.startsWith('#')) {
      return null;
    }

    // Parse error code
    let type: FormulaError['type'] = 'ERROR';
    if (value === '#DIV/0!') type = 'DIV_BY_ZERO';
    else if (value === '#REF!') type = 'REF';
    else if (value === '#VALUE!') type = 'VALUE';
    else if (value === '#NAME?') type = 'NAME';
    else if (value === '#NUM!') type = 'NUM';
    else if (value === '#N/A') type = 'NA';

    return {
      type,
      message: value,
    };
  }, [getCellValue]);

  // Force recalculation (trigger re-sync)
  const recalculate = useCallback(() => {
    setSyncVersion(v => v + 1);
  }, []);

  return {
    getCellValue,
    isError,
    getError,
    recalculate,
  };
}

/**
 * Format error codes for display
 */
export function formatErrorCode(error: FormulaError): string {
  switch (error.type) {
    case 'DIV_BY_ZERO':
      return '#DIV/0!';
    case 'REF':
      return '#REF!';
    case 'VALUE':
      return '#VALUE!';
    case 'NAME':
      return '#NAME?';
    case 'NUM':
      return '#NUM!';
    case 'NA':
      return '#N/A';
    default:
      return '#ERROR!';
  }
}

/**
 * Check if a string is a valid formula (starts with =)
 */
export function isFormula(value: string | number | boolean | null): boolean {
  return typeof value === 'string' && value.trim().startsWith('=');
}
