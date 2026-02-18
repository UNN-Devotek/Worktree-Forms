/**
 * Shared column auto-detection heuristics for Gantt and MobileScheduleView.
 * Extracted to avoid duplication (Finding #5 — DRY violation).
 */

export interface DetectedColumns {
  startDateCol: any | null;
  endDateCol: any | null;
  labelCol: any | null;
}

/**
 * Given a columns array, detect the most likely start-date, end-date, and label columns
 * using type hints and label regex heuristics.
 */
export function detectGanttColumns(columns: any[]): DetectedColumns {
  const dateColumns = columns.filter((col) =>
    col.type === 'DATE' || /date|start|begin|due|end|finish/i.test(col.label)
  );

  const startDateCol =
    dateColumns.find((col) => /start|begin/i.test(col.label)) ||
    dateColumns[0] ||
    null;

  const endDateCol =
    dateColumns.find((col) => /end|finish|due/i.test(col.label)) ||
    dateColumns[1] ||
    null;

  const labelCol =
    columns.find(
      (col) => col.type === 'TEXT' || /name|title|task|label/i.test(col.label)
    ) ||
    columns[0] ||
    null;

  return { startDateCol, endDateCol, labelCol };
}
