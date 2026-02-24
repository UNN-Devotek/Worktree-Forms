export interface FunctionArg {
  name: string;
  required: boolean;
}

export interface FunctionSignature {
  description: string;
  args: FunctionArg[];
}

export const FUNCTION_SIGNATURES: Record<string, FunctionSignature> = {
  // Math & aggregation
  SUM:        { description: 'Adds all numbers in a range of cells.',                   args: [{ name: 'number1', required: true }, { name: 'number2, ...', required: false }] },
  AVERAGE:    { description: 'Returns the arithmetic mean of its arguments.',            args: [{ name: 'number1', required: true }, { name: 'number2, ...', required: false }] },
  MIN:        { description: 'Returns the smallest value in a set of values.',           args: [{ name: 'number1', required: true }, { name: 'number2, ...', required: false }] },
  MAX:        { description: 'Returns the largest value in a set of values.',            args: [{ name: 'number1', required: true }, { name: 'number2, ...', required: false }] },
  COUNT:      { description: 'Counts the number of cells that contain numbers.',         args: [{ name: 'value1', required: true }, { name: 'value2, ...', required: false }] },
  COUNTA:     { description: 'Counts the number of non-empty cells.',                    args: [{ name: 'value1', required: true }, { name: 'value2, ...', required: false }] },
  ROUND:      { description: 'Rounds a number to a specified number of digits.',         args: [{ name: 'number', required: true }, { name: 'num_digits', required: true }] },
  ROUNDUP:    { description: 'Rounds a number up, away from zero.',                      args: [{ name: 'number', required: true }, { name: 'num_digits', required: true }] },
  ROUNDDOWN:  { description: 'Rounds a number down, toward zero.',                       args: [{ name: 'number', required: true }, { name: 'num_digits', required: true }] },
  ABS:        { description: 'Returns the absolute value of a number.',                  args: [{ name: 'number', required: true }] },
  SQRT:       { description: 'Returns the square root of a number.',                     args: [{ name: 'number', required: true }] },
  POWER:      { description: 'Returns the result of a number raised to a power.',        args: [{ name: 'number', required: true }, { name: 'power', required: true }] },
  MOD:        { description: 'Returns the remainder from division.',                     args: [{ name: 'number', required: true }, { name: 'divisor', required: true }] },
  INT:        { description: 'Rounds a number down to the nearest integer.',             args: [{ name: 'number', required: true }] },
  CEILING:    { description: 'Rounds a number up to the nearest multiple of significance.', args: [{ name: 'number', required: true }, { name: 'significance', required: true }] },
  FLOOR:      { description: 'Rounds a number down to the nearest multiple of significance.', args: [{ name: 'number', required: true }, { name: 'significance', required: true }] },
  PRODUCT:    { description: 'Multiplies all numbers given as arguments.',               args: [{ name: 'number1', required: true }, { name: 'number2, ...', required: false }] },
  SUMIF:      { description: 'Sums cells that meet a condition.',                        args: [{ name: 'range', required: true }, { name: 'criteria', required: true }, { name: 'sum_range', required: false }] },
  SUMIFS:     { description: 'Sums cells that meet multiple conditions.',                args: [{ name: 'sum_range', required: true }, { name: 'criteria_range1', required: true }, { name: 'criteria1', required: true }, { name: '...', required: false }] },
  AVERAGEIF:  { description: 'Returns the average of cells that meet a condition.',      args: [{ name: 'range', required: true }, { name: 'criteria', required: true }, { name: 'average_range', required: false }] },
  COUNTIF:    { description: 'Counts cells that meet a condition.',                      args: [{ name: 'range', required: true }, { name: 'criteria', required: true }] },
  COUNTIFS:   { description: 'Counts cells that meet multiple conditions.',              args: [{ name: 'criteria_range1', required: true }, { name: 'criteria1', required: true }, { name: '...', required: false }] },

  // Logical
  IF:         { description: 'Returns one value if condition is true, another if false.', args: [{ name: 'logical_test', required: true }, { name: 'value_if_true', required: true }, { name: 'value_if_false', required: false }] },
  IFS:        { description: 'Checks multiple conditions and returns the first true result.', args: [{ name: 'logical_test1', required: true }, { name: 'value_if_true1', required: true }, { name: '...', required: false }] },
  AND:        { description: 'Returns TRUE if all arguments are true.',                  args: [{ name: 'logical1', required: true }, { name: 'logical2, ...', required: false }] },
  OR:         { description: 'Returns TRUE if any argument is true.',                    args: [{ name: 'logical1', required: true }, { name: 'logical2, ...', required: false }] },
  NOT:        { description: 'Reverses the logic of its argument.',                      args: [{ name: 'logical', required: true }] },
  IFERROR:    { description: 'Returns value_if_error if the expression is an error.',    args: [{ name: 'value', required: true }, { name: 'value_if_error', required: true }] },
  IFNA:       { description: 'Returns value_if_na if the expression evaluates to #N/A.',  args: [{ name: 'value', required: true }, { name: 'value_if_na', required: true }] },

  // Text
  CONCATENATE:{ description: 'Joins text strings into one string.',                      args: [{ name: 'text1', required: true }, { name: 'text2, ...', required: false }] },
  CONCAT:     { description: 'Joins text strings into one string.',                      args: [{ name: 'text1', required: true }, { name: 'text2, ...', required: false }] },
  LEFT:       { description: 'Returns the leftmost characters from a text string.',      args: [{ name: 'text', required: true }, { name: 'num_chars', required: false }] },
  RIGHT:      { description: 'Returns the rightmost characters from a text string.',     args: [{ name: 'text', required: true }, { name: 'num_chars', required: false }] },
  MID:        { description: 'Returns a specific number of characters from a string.',   args: [{ name: 'text', required: true }, { name: 'start_num', required: true }, { name: 'num_chars', required: true }] },
  LEN:        { description: 'Returns the number of characters in a text string.',       args: [{ name: 'text', required: true }] },
  UPPER:      { description: 'Converts text to uppercase.',                              args: [{ name: 'text', required: true }] },
  LOWER:      { description: 'Converts text to lowercase.',                              args: [{ name: 'text', required: true }] },
  TRIM:       { description: 'Removes extra spaces from text.',                          args: [{ name: 'text', required: true }] },
  FIND:       { description: 'Finds one text string within another (case-sensitive).',   args: [{ name: 'find_text', required: true }, { name: 'within_text', required: true }, { name: 'start_num', required: false }] },
  SEARCH:     { description: 'Finds one text string within another (not case-sensitive).', args: [{ name: 'find_text', required: true }, { name: 'within_text', required: true }, { name: 'start_num', required: false }] },
  SUBSTITUTE: { description: 'Substitutes new text for old text in a string.',           args: [{ name: 'text', required: true }, { name: 'old_text', required: true }, { name: 'new_text', required: true }, { name: 'instance_num', required: false }] },
  TEXT:       { description: 'Formats a number and converts it to text.',                args: [{ name: 'value', required: true }, { name: 'format_text', required: true }] },
  VALUE:      { description: 'Converts a text string that represents a number to a number.', args: [{ name: 'text', required: true }] },

  // Lookup & reference
  VLOOKUP:    { description: 'Looks up a value in the first column of a range.',         args: [{ name: 'lookup_value', required: true }, { name: 'table_array', required: true }, { name: 'col_index_num', required: true }, { name: 'range_lookup', required: false }] },
  HLOOKUP:    { description: 'Looks up a value in the first row of a range.',            args: [{ name: 'lookup_value', required: true }, { name: 'table_array', required: true }, { name: 'row_index_num', required: true }, { name: 'range_lookup', required: false }] },
  INDEX:      { description: 'Returns the value at a given position in a range.',        args: [{ name: 'array', required: true }, { name: 'row_num', required: true }, { name: 'column_num', required: false }] },
  MATCH:      { description: 'Returns the relative position of an item in a range.',     args: [{ name: 'lookup_value', required: true }, { name: 'lookup_array', required: true }, { name: 'match_type', required: false }] },
  CHOOSE:     { description: 'Returns a value from a list based on an index.',           args: [{ name: 'index_num', required: true }, { name: 'value1', required: true }, { name: 'value2, ...', required: false }] },

  // Date & time
  TODAY:      { description: 'Returns the current date.',                                args: [] },
  NOW:        { description: 'Returns the current date and time.',                       args: [] },
  DATE:       { description: 'Returns the serial number for a date.',                    args: [{ name: 'year', required: true }, { name: 'month', required: true }, { name: 'day', required: true }] },
  YEAR:       { description: 'Returns the year from a date.',                            args: [{ name: 'serial_number', required: true }] },
  MONTH:      { description: 'Returns the month from a date (1–12).',                   args: [{ name: 'serial_number', required: true }] },
  DAY:        { description: 'Returns the day from a date (1–31).',                     args: [{ name: 'serial_number', required: true }] },
  DAYS:       { description: 'Returns the number of days between two dates.',            args: [{ name: 'end_date', required: true }, { name: 'start_date', required: true }] },
  DATEDIF:    { description: 'Calculates the difference between two dates.',             args: [{ name: 'start_date', required: true }, { name: 'end_date', required: true }, { name: 'unit', required: true }] },
  NETWORKDAYS:{ description: 'Returns the number of working days between two dates.',    args: [{ name: 'start_date', required: true }, { name: 'end_date', required: true }, { name: 'holidays', required: false }] },
};

/**
 * Inspects value[0..cursor] to detect if the cursor is inside a known function call.
 * Returns the function name and the zero-based argument index at the cursor, or null.
 */
export function detectActiveSignature(
  value: string,
  cursor: number,
): { fnName: string; argIndex: number } | null {
  if (!value.startsWith('=')) return null;
  const text = value.slice(0, cursor);

  // Walk backwards through the text tracking paren depth.
  // When we find an unmatched '(' with a function name before it, that's our target.
  let depth = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === ')') { depth++; continue; }
    if (ch === '(') {
      if (depth > 0) { depth--; continue; }
      // Unmatched open paren — find the function name before it
      let j = i - 1;
      while (j >= 0 && /[A-Za-z0-9_]/.test(text[j])) j--;
      const fnName = text.slice(j + 1, i).toUpperCase();
      if (!fnName || !FUNCTION_SIGNATURES[fnName]) return null;

      // Count commas at depth-0 between the '(' and cursor to get arg index
      let argIndex = 0;
      let innerDepth = 0;
      for (let k = i + 1; k < text.length; k++) {
        if (text[k] === '(') innerDepth++;
        else if (text[k] === ')') innerDepth--;
        else if (text[k] === ',' && innerDepth === 0) argIndex++;
      }
      return { fnName, argIndex };
    }
  }
  return null;
}
