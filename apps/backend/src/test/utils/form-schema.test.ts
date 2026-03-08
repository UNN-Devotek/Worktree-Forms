import { describe, it, expect } from 'vitest';
import {
  extractColumnsFromSchema,
  mapFieldTypeToColumnType,
} from '../../utils/form-schema.js';

describe('extractColumnsFromSchema', () => {
  it('[P0] returns empty array for null/undefined/non-object input', () => {
    expect(extractColumnsFromSchema(null)).toEqual([]);
    expect(extractColumnsFromSchema(undefined)).toEqual([]);
    expect(extractColumnsFromSchema('string')).toEqual([]);
    expect(extractColumnsFromSchema(42)).toEqual([]);
  });

  it('[P0] extracts fields from pages[].sections[].fields[]', () => {
    const schema = {
      pages: [
        {
          sections: [
            {
              fields: [
                { id: 'f1', name: 'name', label: 'Full Name', type: 'text' },
                { id: 'f2', name: 'age', label: 'Age', type: 'number' },
              ],
            },
          ],
        },
      ],
    };

    const cols = extractColumnsFromSchema(schema);
    expect(cols).toHaveLength(2);
    expect(cols[0]).toMatchObject({ id: 'name', label: 'Full Name', type: 'text' });
    expect(cols[1]).toMatchObject({ id: 'age', label: 'Age', type: 'number' });
  });

  it('[P0] filters out display-only field types', () => {
    const schema = {
      pages: [
        {
          sections: [
            {
              fields: [
                { id: 'h1', type: 'header', label: 'Section Header' },
                { id: 'p1', type: 'paragraph', label: 'Info' },
                { id: 'f1', name: 'email', label: 'Email', type: 'email' },
                { id: 'd1', type: 'divider', label: '' },
                { id: 'img', type: 'image', label: 'Logo' },
              ],
            },
          ],
        },
      ],
    };

    const cols = extractColumnsFromSchema(schema);
    expect(cols).toHaveLength(1);
    expect(cols[0].type).toBe('email');
  });

  it('[P0] extracts from pages[].elements[] fallback', () => {
    const schema = {
      pages: [
        {
          elements: [
            { id: 'e1', name: 'city', label: 'City', type: 'text' },
            { id: 'e2', type: 'heading', label: 'Heading' }, // display-only
          ],
        },
      ],
    };

    const cols = extractColumnsFromSchema(schema);
    expect(cols).toHaveLength(1);
    expect(cols[0]).toMatchObject({ id: 'city', label: 'City', type: 'text' });
  });

  it('[P1] falls back to field.id when name is absent', () => {
    const schema = {
      pages: [
        {
          sections: [
            {
              fields: [{ id: 'my-field', label: 'My Field', type: 'text' }],
            },
          ],
        },
      ],
    };

    const cols = extractColumnsFromSchema(schema);
    expect(cols[0].id).toBe('my-field');
  });

  it('[P1] falls back to label/id when label is absent', () => {
    const schema = {
      pages: [
        {
          sections: [
            {
              fields: [{ id: 'f1', name: 'score', type: 'number' }],
            },
          ],
        },
      ],
    };

    const cols = extractColumnsFromSchema(schema);
    expect(cols[0].label).toBe('score'); // fallback to name
  });

  it('[P1] returns empty array when schema has no pages', () => {
    expect(extractColumnsFromSchema({})).toEqual([]);
    expect(extractColumnsFromSchema({ pages: [] })).toEqual([]);
  });

  it('[P1] handles multi-page schema', () => {
    const schema = {
      pages: [
        { sections: [{ fields: [{ id: 'f1', name: 'a', label: 'A', type: 'text' }] }] },
        { sections: [{ fields: [{ id: 'f2', name: 'b', label: 'B', type: 'email' }] }] },
      ],
    };

    const cols = extractColumnsFromSchema(schema);
    expect(cols).toHaveLength(2);
    expect(cols.map((c) => c.id)).toEqual(['a', 'b']);
  });
});

describe('mapFieldTypeToColumnType', () => {
  it('[P0] maps number/rating/scale → NUMBER', () => {
    expect(mapFieldTypeToColumnType('number')).toBe('NUMBER');
    expect(mapFieldTypeToColumnType('rating')).toBe('NUMBER');
    expect(mapFieldTypeToColumnType('scale')).toBe('NUMBER');
  });

  it('[P0] maps date/datetime/time → DATE', () => {
    expect(mapFieldTypeToColumnType('date')).toBe('DATE');
    expect(mapFieldTypeToColumnType('datetime')).toBe('DATE');
    expect(mapFieldTypeToColumnType('time')).toBe('DATE');
  });

  it('[P0] maps checkbox/toggle/select/radio → STATUS', () => {
    expect(mapFieldTypeToColumnType('checkbox')).toBe('STATUS');
    expect(mapFieldTypeToColumnType('toggle')).toBe('STATUS');
    expect(mapFieldTypeToColumnType('select')).toBe('STATUS');
    expect(mapFieldTypeToColumnType('radio')).toBe('STATUS');
  });

  it('[P0] maps unknown/text types → TEXT', () => {
    expect(mapFieldTypeToColumnType('text')).toBe('TEXT');
    expect(mapFieldTypeToColumnType('email')).toBe('TEXT');
    expect(mapFieldTypeToColumnType('textarea')).toBe('TEXT');
    expect(mapFieldTypeToColumnType('signature')).toBe('TEXT');
    expect(mapFieldTypeToColumnType('')).toBe('TEXT');
    expect(mapFieldTypeToColumnType('unknown-type')).toBe('TEXT');
  });
});
