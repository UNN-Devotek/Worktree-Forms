'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HyperFormula } from 'hyperformula';
import { useSheet } from '../../providers/SheetProvider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const FORMULA_FUNCTIONS = HyperFormula.getRegisteredFunctionNames('enGB');

export function FormulaBar() {
  const {
    focusedCell,
    data,
    columns,
    updateCell,
    isFormulaEditing,
    setIsFormulaEditing,
    insertCellRefCallback,
  } = useSheet();

  // Find the raw value of the focused cell
  const cellValue = (() => {
    if (!focusedCell) return '';
    const row = data.find((r: any) => r.id === focusedCell.rowId);
    if (!row) return '';
    const val = row[focusedCell.columnId];
    return val != null ? String(val) : '';
  })();

  const cellLabel = (() => {
    if (!focusedCell) return '';
    const colIndex = columns.findIndex((c: any) => c.id === focusedCell.columnId);
    const rowIndex = data.findIndex((r: any) => r.id === focusedCell.rowId);
    if (colIndex === -1 || rowIndex === -1) return '';
    // Excel-style: A1, B2, etc.
    const colLetter = String.fromCharCode(65 + colIndex);
    return `${colLetter}${rowIndex + 1}`;
  })();

  const [localValue, setLocalValue] = useState(cellValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autocomplete state
  const [autocompleteMatches, setAutocompleteMatches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  // currentTokenRef tracks the typed fragment for function replacement without causing re-renders
  const currentTokenRef = useRef('');

  // Sync external cell value changes (when cell is refocused or changed externally)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(cellValue);
    }
  }, [cellValue, isEditing]);

  // Clear insertCellRefCallback when formula editing ends
  useEffect(() => {
    if (!isFormulaEditing) {
      insertCellRefCallback.current = null;
    }
  }, [isFormulaEditing, insertCellRefCallback]);

  /**
   * Compute autocomplete matches from the current value and cursor position.
   * The token is the substring from the last =, (, ,, or whitespace up to the cursor.
   */
  const computeAutocomplete = useCallback((value: string, cursorPos: number) => {
    if (!value.startsWith('=')) {
      setAutocompleteMatches([]);
      currentTokenRef.current = '';
      return;
    }

    const textToCursor = value.slice(0, cursorPos);
    // Find the last delimiter: =, (, ,, or whitespace
    const lastDelimIndex = Math.max(
      textToCursor.lastIndexOf('='),
      textToCursor.lastIndexOf('('),
      textToCursor.lastIndexOf(','),
      textToCursor.lastIndexOf(' '),
    );
    const rawToken = textToCursor.slice(lastDelimIndex + 1);
    // Strip leading non-alpha characters
    const token = rawToken.replace(/^[^a-zA-Z]+/, '');

    currentTokenRef.current = token;

    if (token.length < 1) {
      setAutocompleteMatches([]);
      return;
    }

    const upperToken = token.toUpperCase();
    const matches = FORMULA_FUNCTIONS
      .filter((fn) => fn.startsWith(upperToken))
      .slice(0, 10);

    setAutocompleteMatches(matches);
    setActiveIndex(-1);
  }, []);

  /**
   * Insert a cell ref string at the current cursor position in the formula bar.
   * This is registered as insertCellRefCallback when the input is focused.
   */
  const insertCellRef = useCallback((ref: string) => {
    const input = inputRef.current;
    if (!input) return;

    const pos = input.selectionStart ?? localValue.length;
    const newValue = localValue.slice(0, pos) + ref + localValue.slice(pos);
    setLocalValue(newValue);
    setIsEditing(true);

    // Restore cursor after the inserted ref after state update
    const newCursorPos = pos + ref.length;
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  }, [localValue]);

  // Keep the insertCellRefCallback ref current whenever insertCellRef changes
  useEffect(() => {
    if (isFormulaEditing) {
      insertCellRefCallback.current = insertCellRef;
    }
  }, [isFormulaEditing, insertCellRef, insertCellRefCallback]);

  const closeAutocomplete = () => {
    setAutocompleteMatches([]);
    setActiveIndex(-1);
    currentTokenRef.current = '';
  };

  /** Append closing parens to balance any unclosed ones in a formula */
  const autoClose = (v: string): string => {
    if (!v.startsWith('=')) return v;
    const open = (v.match(/\(/g) || []).length;
    const close = (v.match(/\)/g) || []).length;
    const missing = open - close;
    return missing > 0 ? v + ')'.repeat(missing) : v;
  };

  const handleCommit = () => {
    if (!focusedCell) return;
    const committed = autoClose(localValue);
    if (committed !== cellValue) {
      updateCell(focusedCell.rowId, focusedCell.columnId, committed);
    }
    if (committed !== localValue) setLocalValue(committed);
    setIsEditing(false);
    closeAutocomplete();
  };

  /**
   * Insert a function name at the current cursor position and close autocomplete.
   * Replaces the fragment the user has already typed with the full function name + (.
   */
  const insertFunction = useCallback((fnName: string) => {
    const input = inputRef.current;
    const pos = input?.selectionStart ?? localValue.length;

    // Determine where the typed token starts in localValue
    const tokenStartInValue = (() => {
      const textToCursor = localValue.slice(0, pos);
      const lastDelimIndex = Math.max(
        textToCursor.lastIndexOf('='),
        textToCursor.lastIndexOf('('),
        textToCursor.lastIndexOf(','),
        textToCursor.lastIndexOf(' '),
      );
      const rawTokenStart = lastDelimIndex + 1;
      const rawToken = textToCursor.slice(rawTokenStart);
      const leadingNonAlpha = rawToken.match(/^[^a-zA-Z]*/)?.[0].length ?? 0;
      return rawTokenStart + leadingNonAlpha;
    })();

    const insertion = fnName + '(';
    const newValue =
      localValue.slice(0, tokenStartInValue) + insertion + localValue.slice(pos);
    setLocalValue(newValue);
    setIsEditing(true);
    setAutocompleteMatches([]);
    setActiveIndex(-1);
    currentTokenRef.current = '';

    const newCursorPos = tokenStartInValue + insertion.length;
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  }, [localValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle autocomplete navigation first
    if (autocompleteMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, autocompleteMatches.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
        return;
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && activeIndex >= 0) {
        e.preventDefault();
        insertFunction(autocompleteMatches[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAutocomplete();
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setLocalValue(cellValue);
      setIsEditing(false);
      setIsFormulaEditing(false);
      closeAutocomplete();
      inputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
    if (localValue.startsWith('=')) {
      setIsFormulaEditing(true);
      insertCellRefCallback.current = insertCellRef;
    }
  };

  const handleBlur = () => {
    // If focus is staying inside the formula bar (e.g. clicking the dropdown), keep editing
    if (document.activeElement?.closest('[data-formula-bar]')) {
      return;
    }
    // Otherwise close formula editing and commit
    setIsFormulaEditing(false);
    closeAutocomplete();
    handleCommit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsEditing(true);

    if (newValue.startsWith('=')) {
      setIsFormulaEditing(true);
      insertCellRefCallback.current = insertCellRef;
      const cursorPos = e.target.selectionStart ?? newValue.length;
      computeAutocomplete(newValue, cursorPos);
    } else {
      if (isFormulaEditing) {
        setIsFormulaEditing(false);
      }
      closeAutocomplete();
    }
  };

  const showDropdown = autocompleteMatches.length > 0 && localValue.startsWith('=');

  return (
    <div
      data-formula-bar
      className={cn(
        'flex items-center gap-2 px-3 py-1 bg-background relative',
        isFormulaEditing
          ? 'border-b border-blue-400 bg-blue-50/30'
          : 'border-b',
      )}
    >
      {/* Cell reference indicator */}
      <div className="flex-none w-16 text-xs text-muted-foreground font-mono text-center border rounded px-2 py-1 bg-muted/30 truncate">
        {cellLabel || '—'}
      </div>
      <div className="flex-none text-muted-foreground text-sm font-mono">fx</div>
      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={focusedCell ? '' : 'Select a cell to edit its formula'}
          disabled={!focusedCell}
          className={cn(
            'h-7 w-full font-mono text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent',
            !focusedCell && 'placeholder:text-muted-foreground/50',
          )}
        />

        {/* Formula autocomplete dropdown — lives inside data-formula-bar so blur guard works */}
        {showDropdown && (
          <div className="absolute left-0 top-full mt-0.5 w-64 bg-neutral-800 dark:bg-neutral-800 border border-neutral-600 shadow-lg rounded-md z-[100] max-h-48 overflow-y-auto">
            {autocompleteMatches.map((fn, idx) => (
              <div
                key={fn}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction(fn);
                }}
                className={cn(
                  'px-3 py-1.5 text-sm font-mono cursor-pointer text-neutral-100 hover:bg-neutral-600',
                  idx === activeIndex && 'bg-neutral-600',
                )}
              >
                {fn}
                <span className="text-neutral-400">(</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual cue for cell-reference picking mode */}
      {isFormulaEditing && (
        <div className="flex-none text-xs text-blue-500 italic whitespace-nowrap">
          (click a cell to insert reference)
        </div>
      )}
    </div>
  );
}
