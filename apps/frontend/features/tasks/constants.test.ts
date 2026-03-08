import { describe, it, expect } from 'vitest';
import {
  TASK_TYPES,
  TASK_TYPE_MAP,
  TASK_STATUSES,
  STATUS_MAP,
  PRIORITY_LEVELS,
  PRIORITY_MAP,
  KANBAN_STATUS_COLUMNS,
  TASK_TYPE_BUTTON_MAP,
  STATUS_BADGE_MAP,
  PRIORITY_BADGE_MAP,
} from './constants';

// ---------------------------------------------------------------------------
// TASK_TYPES
// ---------------------------------------------------------------------------

describe('TASK_TYPES', () => {
  it('[P0] contains all expected task type values', () => {
    const values = TASK_TYPES.map((t) => t.value);
    expect(values).toContain('RFI');
    expect(values).toContain('GENERAL');
    expect(values).toContain('PUNCH_LIST');
    expect(values).toContain('INSPECTION');
    expect(values).toContain('SUBMITTAL');
    expect(values).toContain('CHANGE_ORDER');
    expect(values).toContain('SAFETY');
    expect(values).toContain('DEFICIENCY');
  });

  it('[P0] every task type has value, label, and description', () => {
    TASK_TYPES.forEach((t) => {
      expect(t.value).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.description).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// TASK_TYPE_MAP
// ---------------------------------------------------------------------------

describe('TASK_TYPE_MAP', () => {
  it('[P0] maps every TASK_TYPES value to its label', () => {
    TASK_TYPES.forEach((t) => {
      expect(TASK_TYPE_MAP[t.value]).toBe(t.label);
    });
  });

  it('[P1] contains exactly the same number of entries as TASK_TYPES', () => {
    expect(Object.keys(TASK_TYPE_MAP)).toHaveLength(TASK_TYPES.length);
  });
});

// ---------------------------------------------------------------------------
// TASK_STATUSES
// ---------------------------------------------------------------------------

describe('TASK_STATUSES', () => {
  it('[P0] contains DRAFT, ACTIVE, IN_PROGRESS, COMPLETED', () => {
    const values = TASK_STATUSES.map((s) => s.value);
    expect(values).toContain('DRAFT');
    expect(values).toContain('ACTIVE');
    expect(values).toContain('IN_PROGRESS');
    expect(values).toContain('COMPLETED');
  });

  it('[P0] every status has value, label, and color', () => {
    TASK_STATUSES.forEach((s) => {
      expect(s.value).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.color).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// STATUS_MAP
// ---------------------------------------------------------------------------

describe('STATUS_MAP', () => {
  it('[P0] maps every status to { label, color }', () => {
    TASK_STATUSES.forEach((s) => {
      expect(STATUS_MAP[s.value].label).toBe(s.label);
      expect(STATUS_MAP[s.value].color).toBe(s.color);
    });
  });
});

// ---------------------------------------------------------------------------
// PRIORITY_LEVELS
// ---------------------------------------------------------------------------

describe('PRIORITY_LEVELS', () => {
  it('[P0] contains LOW, MEDIUM, HIGH, URGENT', () => {
    const values = PRIORITY_LEVELS.map((p) => p.value);
    expect(values).toContain('LOW');
    expect(values).toContain('MEDIUM');
    expect(values).toContain('HIGH');
    expect(values).toContain('URGENT');
  });

  it('[P0] every priority has value, label, color, and dot', () => {
    PRIORITY_LEVELS.forEach((p) => {
      expect(p.value).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.color).toBeTruthy();
      expect(p.dot).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// PRIORITY_MAP
// ---------------------------------------------------------------------------

describe('PRIORITY_MAP', () => {
  it('[P0] maps every priority to { label, color, dot }', () => {
    PRIORITY_LEVELS.forEach((p) => {
      expect(PRIORITY_MAP[p.value].label).toBe(p.label);
      expect(PRIORITY_MAP[p.value].color).toBe(p.color);
      expect(PRIORITY_MAP[p.value].dot).toBe(p.dot);
    });
  });
});

// ---------------------------------------------------------------------------
// KANBAN_STATUS_COLUMNS
// ---------------------------------------------------------------------------

describe('KANBAN_STATUS_COLUMNS', () => {
  it('[P0] includes ACTIVE, IN_PROGRESS, COMPLETED', () => {
    expect(KANBAN_STATUS_COLUMNS).toContain('ACTIVE');
    expect(KANBAN_STATUS_COLUMNS).toContain('IN_PROGRESS');
    expect(KANBAN_STATUS_COLUMNS).toContain('COMPLETED');
  });

  it('[P1] does not include DRAFT (draft items are not shown in kanban)', () => {
    expect(KANBAN_STATUS_COLUMNS).not.toContain('DRAFT');
  });
});

// ---------------------------------------------------------------------------
// TASK_TYPE_BUTTON_MAP
// ---------------------------------------------------------------------------

describe('TASK_TYPE_BUTTON_MAP', () => {
  it('[P0] every TASK_TYPES value has a button variant entry', () => {
    TASK_TYPES.forEach((t) => {
      expect(TASK_TYPE_BUTTON_MAP[t.value]).toBeDefined();
    });
  });

  it('[P0] SAFETY maps to destructive (red)', () => {
    expect(TASK_TYPE_BUTTON_MAP['SAFETY']).toBe('destructive');
  });

  it('[P0] RFI maps to default', () => {
    expect(TASK_TYPE_BUTTON_MAP['RFI']).toBe('default');
  });
});

// ---------------------------------------------------------------------------
// STATUS_BADGE_MAP
// ---------------------------------------------------------------------------

describe('STATUS_BADGE_MAP', () => {
  it('[P0] DRAFT maps to pending badge', () => {
    expect(STATUS_BADGE_MAP['DRAFT']).toBe('pending');
  });

  it('[P0] COMPLETED maps to done badge', () => {
    expect(STATUS_BADGE_MAP['COMPLETED']).toBe('done');
  });

  it('[P0] IN_PROGRESS maps to processing badge', () => {
    expect(STATUS_BADGE_MAP['IN_PROGRESS']).toBe('processing');
  });
});

// ---------------------------------------------------------------------------
// PRIORITY_BADGE_MAP
// ---------------------------------------------------------------------------

describe('PRIORITY_BADGE_MAP', () => {
  it('[P0] URGENT maps to destructive badge', () => {
    expect(PRIORITY_BADGE_MAP['URGENT']).toBe('destructive');
  });

  it('[P0] LOW maps to low badge', () => {
    expect(PRIORITY_BADGE_MAP['LOW']).toBe('low');
  });

  it('[P0] HIGH maps to high badge', () => {
    expect(PRIORITY_BADGE_MAP['HIGH']).toBe('high');
  });
});
