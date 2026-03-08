import { describe, it, expect } from 'vitest';
import {
  getStatusColor,
  getPriorityColor,
  formatDate,
  formatDateShort,
  APPLICATION_STATUSES,
  APPLICATION_PRIORITIES,
  GAME_OPTIONS,
} from './application-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('APPLICATION_STATUSES', () => {
  it('[P0] contains all expected status keys', () => {
    const keys = Object.keys(APPLICATION_STATUSES);
    expect(keys).toContain('pending');
    expect(keys).toContain('approved');
    expect(keys).toContain('denied');
    expect(keys).toContain('under_review');
    expect(keys).toContain('interview_scheduled');
  });

  it('[P0] each status has label and description', () => {
    Object.values(APPLICATION_STATUSES).forEach((entry) => {
      expect(entry.label).toBeTruthy();
      expect(entry.description).toBeTruthy();
    });
  });
});

describe('APPLICATION_PRIORITIES', () => {
  it('[P0] contains normal, high, and urgent', () => {
    expect(APPLICATION_PRIORITIES.normal.label).toBe('Normal');
    expect(APPLICATION_PRIORITIES.high.label).toBe('High');
    expect(APPLICATION_PRIORITIES.urgent.label).toBe('Urgent');
  });
});

describe('GAME_OPTIONS', () => {
  it('[P0] is a non-empty array of strings', () => {
    expect(Array.isArray(GAME_OPTIONS)).toBe(true);
    expect(GAME_OPTIONS.length).toBeGreaterThan(0);
    GAME_OPTIONS.forEach((g) => expect(typeof g).toBe('string'));
  });
});

// ---------------------------------------------------------------------------
// getStatusColor
// ---------------------------------------------------------------------------

describe('getStatusColor', () => {
  it('[P0] pending returns muted class', () => {
    expect(getStatusColor('pending')).toContain('muted');
  });

  it('[P0] under_review returns primary class', () => {
    expect(getStatusColor('under_review')).toContain('primary');
  });

  it('[P0] interview_scheduled returns accent class', () => {
    expect(getStatusColor('interview_scheduled')).toContain('accent');
  });

  it('[P0] approved returns success class', () => {
    expect(getStatusColor('approved')).toContain('success');
  });

  it('[P0] denied returns destructive class', () => {
    expect(getStatusColor('denied')).toContain('destructive');
  });

  it('[P1] unknown status returns muted fallback', () => {
    expect(getStatusColor('unknown_status' as any)).toContain('muted');
  });

  it('[P1] each status returns a string containing both text and bg classes', () => {
    const statuses: Array<'pending' | 'approved' | 'denied' | 'under_review' | 'interview_scheduled'> =
      ['pending', 'approved', 'denied', 'under_review', 'interview_scheduled'];
    statuses.forEach((s) => {
      const color = getStatusColor(s);
      expect(color).toMatch(/bg-/);
      expect(color).toMatch(/text-/);
    });
  });
});

// ---------------------------------------------------------------------------
// getPriorityColor
// ---------------------------------------------------------------------------

describe('getPriorityColor', () => {
  it('[P0] urgent returns destructive class', () => {
    expect(getPriorityColor('urgent')).toContain('destructive');
  });

  it('[P0] high returns warning class', () => {
    expect(getPriorityColor('high')).toContain('warning');
  });

  it('[P0] normal returns muted class', () => {
    expect(getPriorityColor('normal')).toContain('muted');
  });

  it('[P1] unknown priority returns muted fallback', () => {
    expect(getPriorityColor('unknown' as any)).toContain('muted');
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('[P0] returns N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('[P0] returns N/A for undefined', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('[P0] returns N/A for empty string', () => {
    expect(formatDate('')).toBe('N/A');
  });

  it('[P0] formats a valid ISO date string (includes year, month abbreviation, day)', () => {
    const result = formatDate('2025-06-15T12:00:00.000Z');
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/15/);
  });

  it('[P1] includes time portion (hour:minute format)', () => {
    const result = formatDate('2025-01-01T00:00:00.000Z');
    // Should contain a colon indicating HH:MM
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// formatDateShort
// ---------------------------------------------------------------------------

describe('formatDateShort', () => {
  it('[P0] returns N/A for null', () => {
    expect(formatDateShort(null)).toBe('N/A');
  });

  it('[P0] returns N/A for undefined', () => {
    expect(formatDateShort(undefined)).toBe('N/A');
  });

  it('[P0] formats a valid date without time', () => {
    const result = formatDateShort('2025-03-20T00:00:00.000Z');
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/20/);
  });

  it('[P1] does not include hour:minute (shorter than formatDate)', () => {
    const full = formatDate('2025-01-01T12:30:00.000Z');
    const short = formatDateShort('2025-01-01T12:30:00.000Z');
    expect(short.length).toBeLessThan(full.length);
  });
});
