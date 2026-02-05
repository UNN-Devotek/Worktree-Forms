'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Cell, CellBounds, CellFormat, DEFAULT_FONT, getColumnLabel } from './types';

// Common Excel formulas for autocomplete
const FORMULA_SUGGESTIONS = [
  { name: 'SUM', description: 'Adds all numbers in a range', syntax: 'SUM(range)' },
  { name: 'AVERAGE', description: 'Returns the average of numbers', syntax: 'AVERAGE(range)' },
  { name: 'COUNT', description: 'Counts numbers in a range', syntax: 'COUNT(range)' },
  { name: 'MAX', description: 'Returns the largest value', syntax: 'MAX(range)' },
  { name: 'MIN', description: 'Returns the smallest value', syntax: 'MIN(range)' },
  { name: 'IF', description: 'Returns one value if true, another if false', syntax: 'IF(condition, true_value, false_value)' },
  { name: 'VLOOKUP', description: 'Looks up a value in a table', syntax: 'VLOOKUP(lookup_value, table, col_index, [exact])' },
  { name: 'COUNTIF', description: 'Counts cells that meet criteria', syntax: 'COUNTIF(range, criteria)' },
  { name: 'SUMIF', description: 'Sums cells that meet criteria', syntax: 'SUMIF(range, criteria, [sum_range])' },
  { name: 'ROUND', description: 'Rounds a number to a specified number of digits', syntax: 'ROUND(number, digits)' },
  { name: 'CONCATENATE', description: 'Joins text strings together', syntax: 'CONCATENATE(text1, text2, ...)' },
  { name: 'LEFT', description: 'Returns leftmost characters', syntax: 'LEFT(text, num_chars)' },
  { name: 'RIGHT', description: 'Returns rightmost characters', syntax: 'RIGHT(text, num_chars)' },
  { name: 'MID', description: 'Returns characters from the middle', syntax: 'MID(text, start, num_chars)' },
  { name: 'LEN', description: 'Returns length of text', syntax: 'LEN(text)' },
  { name: 'UPPER', description: 'Converts text to uppercase', syntax: 'UPPER(text)' },
  { name: 'LOWER', description: 'Converts text to lowercase', syntax: 'LOWER(text)' },
  { name: 'TRIM', description: 'Removes extra spaces', syntax: 'TRIM(text)' },
];

interface CellEditorProps {
  cell: Cell;
  bounds: CellBounds;
  value: string;
  format?: CellFormat;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onCellReferenceMode?: (mode: boolean) => void;
  onCellReferenceAdd?: (reference: string) => void;
}

export const CellEditor: React.FC<CellEditorProps> = ({
  cell,
  bounds,
  value,
  format,
  onChange,
  onCommit,
  onCancel,
  onCellReferenceMode,
  onCellReferenceAdd,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [isPickingReference, setIsPickingReference] = useState(false);

  // Filter formula suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!value.startsWith('=')) return [];

    // Extract the current formula name being typed
    const match = value.match(/=([A-Z]*)$/);
    if (!match) return [];

    const query = match[1].toUpperCase();
    if (!query) return FORMULA_SUGGESTIONS;

    return FORMULA_SUGGESTIONS.filter(f =>
      f.name.startsWith(query)
    );
  }, [value]);

  // Check if we should enter cell reference picking mode
  useEffect(() => {
    const isFormula = value.startsWith('=');
    const hasOpenParen = value.includes('(');
    const picking = isFormula && hasOpenParen && !value.endsWith(')');

    setIsPickingReference(picking);
    if (onCellReferenceMode) {
      onCellReferenceMode(picking);
    }
  }, [value, onCellReferenceMode]);

  // Show/hide autocomplete
  useEffect(() => {
    const shouldShow = value.startsWith('=') &&
                      !value.includes('(') &&
                      filteredSuggestions.length > 0;
    setShowAutocomplete(shouldShow);
    if (shouldShow) {
      setAutocompleteIndex(0);
    }
  }, [value, filteredSuggestions.length]);

  // Focus and select all on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleAutocompleteSelect = (suggestion: typeof FORMULA_SUGGESTIONS[0]) => {
    onChange(`=${suggestion.name}(`);
    setShowAutocomplete(false);
    // Keep focus on input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Don't propagate to parent (prevent double-handling)
    e.stopPropagation();

    // Handle autocomplete navigation
    if (showAutocomplete) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setAutocompleteIndex((prev) =>
            Math.min(prev + 1, filteredSuggestions.length - 1)
          );
          return;
        case 'ArrowUp':
          e.preventDefault();
          setAutocompleteIndex((prev) => Math.max(prev - 1, 0));
          return;
        case 'Tab':
        case 'Enter':
          e.preventDefault();
          if (filteredSuggestions[autocompleteIndex]) {
            handleAutocompleteSelect(filteredSuggestions[autocompleteIndex]);
          }
          return;
      }
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onCommit();
        break;
      case 'Tab':
        e.preventDefault();
        onCommit();
        break;
      case 'Escape':
        e.preventDefault();
        setShowAutocomplete(false);
        if (showAutocomplete) {
          // First escape closes autocomplete
          return;
        }
        onCancel();
        break;
      // All other keys pass through to input
    }
  };

  const handleBlur = () => {
    // Commit on blur (clicking outside)
    onCommit();
  };

  const font = format?.font || DEFAULT_FONT;

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{
        left: `${bounds.x}px`,
        top: `${bounds.y}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full h-full px-2 border-2 border-primary focus:outline-none focus:ring-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        style={{
          fontFamily: font.family,
          fontSize: `${font.size}px`,
          fontWeight: font.bold ? 'bold' : 'normal',
          fontStyle: font.italic ? 'italic' : 'normal',
          textAlign: format?.align || 'left',
        }}
        data-cell-editor
        data-row={cell.row}
        data-col={cell.col}
      />

      {/* Formula Autocomplete Dropdown */}
      {showAutocomplete && (
        <div className="absolute left-0 mt-1 w-96 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-[60]">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.name}
              className={`px-3 py-2 cursor-pointer ${
                index === autocompleteIndex
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                handleAutocompleteSelect(suggestion);
              }}
              onMouseEnter={() => setAutocompleteIndex(index)}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {suggestion.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {suggestion.syntax}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                {suggestion.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cell Reference Picking Indicator */}
      {isPickingReference && (
        <div className="absolute left-0 -bottom-6 text-xs text-blue-600 dark:text-blue-400 font-semibold">
          Click cells to add reference
        </div>
      )}
    </div>
  );
};
