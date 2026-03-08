import { describe, it, expect } from 'vitest';
import { detectGanttColumns } from './ganttUtils';

function col(label: string, type = 'TEXT') {
  return { label, type };
}

describe('detectGanttColumns', () => {
  // ─── startDateCol ──────────────────────────────────────────────────────────

  describe('startDateCol detection', () => {
    it('[P0] picks column labelled "Start Date" as startDateCol', () => {
      const columns = [col('Start Date', 'DATE'), col('End Date', 'DATE'), col('Task Name')];
      const { startDateCol } = detectGanttColumns(columns);
      expect(startDateCol?.label).toBe('Start Date');
    });

    it('[P0] picks column with "begin" in label as startDateCol', () => {
      const columns = [col('Begin Date', 'DATE'), col('Finish Date', 'DATE'), col('Title')];
      const { startDateCol } = detectGanttColumns(columns);
      expect(startDateCol?.label).toBe('Begin Date');
    });

    it('[P0] falls back to first DATE column when no start/begin label exists', () => {
      const columns = [col('Due Date', 'DATE'), col('End', 'DATE'), col('Name')];
      const { startDateCol } = detectGanttColumns(columns);
      expect(startDateCol?.label).toBe('Due Date');
    });

    it('[P1] returns null when no date-like columns exist', () => {
      const columns = [col('Name'), col('Status')];
      const { startDateCol } = detectGanttColumns(columns);
      expect(startDateCol).toBeNull();
    });
  });

  // ─── endDateCol ────────────────────────────────────────────────────────────

  describe('endDateCol detection', () => {
    it('[P0] picks column labelled "End Date" as endDateCol', () => {
      const columns = [col('Start Date', 'DATE'), col('End Date', 'DATE'), col('Task')];
      const { endDateCol } = detectGanttColumns(columns);
      expect(endDateCol?.label).toBe('End Date');
    });

    it('[P0] picks column labelled "Finish" as endDateCol', () => {
      const columns = [col('Start', 'DATE'), col('Finish', 'DATE'), col('Title')];
      const { endDateCol } = detectGanttColumns(columns);
      expect(endDateCol?.label).toBe('Finish');
    });

    it('[P0] picks column labelled "Due Date" as endDateCol', () => {
      const columns = [col('Start', 'DATE'), col('Due Date', 'DATE'), col('Name')];
      const { endDateCol } = detectGanttColumns(columns);
      expect(endDateCol?.label).toBe('Due Date');
    });

    it('[P1] falls back to second DATE column when no end/finish/due label exists', () => {
      const columns = [col('Date A', 'DATE'), col('Date B', 'DATE'), col('Name')];
      const { endDateCol } = detectGanttColumns(columns);
      expect(endDateCol?.label).toBe('Date B');
    });

    it('[P1] endDateCol is null when only one date column exists and start takes it', () => {
      const columns = [col('Start', 'DATE'), col('Name')];
      const { startDateCol, endDateCol } = detectGanttColumns(columns);
      expect(startDateCol?.label).toBe('Start');
      expect(endDateCol).toBeNull();
    });
  });

  // ─── labelCol ─────────────────────────────────────────────────────────────

  describe('labelCol detection', () => {
    it('[P0] picks TEXT column labelled "Name" as labelCol', () => {
      const columns = [col('Start Date', 'DATE'), col('Name', 'TEXT')];
      const { labelCol } = detectGanttColumns(columns);
      expect(labelCol?.label).toBe('Name');
    });

    it('[P0] picks column with "title" in label', () => {
      const columns = [col('Title', 'TEXT'), col('Start', 'DATE')];
      const { labelCol } = detectGanttColumns(columns);
      expect(labelCol?.label).toBe('Title');
    });

    it('[P0] picks column with "task" in label', () => {
      const columns = [col('Task', 'TEXT'), col('Start', 'DATE')];
      const { labelCol } = detectGanttColumns(columns);
      expect(labelCol?.label).toBe('Task');
    });

    it('[P1] falls back to first column if no TEXT/name/title/task match', () => {
      const columns = [col('Random', 'NUMBER'), col('Other', 'NUMBER')];
      const { labelCol } = detectGanttColumns(columns);
      expect(labelCol?.label).toBe('Random');
    });
  });

  // ─── Empty / edge cases ───────────────────────────────────────────────────

  describe('edge cases', () => {
    it('[P0] returns all nulls for empty columns array', () => {
      const { startDateCol, endDateCol, labelCol } = detectGanttColumns([]);
      expect(startDateCol).toBeNull();
      expect(endDateCol).toBeNull();
      expect(labelCol).toBeNull();
    });

    it('[P1] TYPE=DATE columns without matching labels use positional fallback', () => {
      const columns = [col('Alpha', 'DATE'), col('Beta', 'DATE'), col('Gamma', 'DATE')];
      const { startDateCol, endDateCol } = detectGanttColumns(columns);
      expect(startDateCol?.label).toBe('Alpha');
      expect(endDateCol?.label).toBe('Beta');
    });

    it('[P1] case-insensitive label matching — "START DATE" is detected', () => {
      const columns = [col('START DATE', 'DATE'), col('END DATE', 'DATE')];
      const { startDateCol } = detectGanttColumns(columns);
      expect(startDateCol?.label).toBe('START DATE');
    });
  });
});
