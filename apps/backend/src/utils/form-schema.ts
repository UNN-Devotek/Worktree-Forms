/**
 * form-schema.ts
 * Utilities for extracting column definitions from a form schema JSON.
 */

const DISPLAY_FIELD_TYPES = new Set([
  'header', 'paragraph', 'divider', 'image', 'html',
  'heading', 'text_element', 'image_element', 'section',
]);

/**
 * Walks form_schema.pages[n].sections[m].fields[] (or pages[n].elements[])
 * and returns a flat array of { id, label, type } for non-display fields.
 */
export function extractColumnsFromSchema(
  form_json: any
): Array<{ id: string; label: string; type: string }> {
  if (!form_json || typeof form_json !== 'object') return [];

  const pages: any[] = Array.isArray(form_json.pages) ? form_json.pages : [];
  const columns: Array<{ id: string; label: string; type: string }> = [];

  for (const page of pages) {
    // Support both sections[].fields[] and elements[]
    const sections: any[] = Array.isArray(page?.sections) ? page.sections : [];
    for (const section of sections) {
      const fields: any[] = Array.isArray(section?.fields) ? section.fields : [];
      for (const field of fields) {
        const type: string = field?.type ?? '';
        if (!DISPLAY_FIELD_TYPES.has(type) && type) {
          columns.push({
            id: field.name ?? field.id ?? '',
            label: field.label || field.name || field.id || 'Field',
            type,
          });
        }
      }
    }

    // Fallback: pages[n].elements[]
    const elements: any[] = Array.isArray(page?.elements) ? page.elements : [];
    for (const el of elements) {
      const type: string = el?.type ?? '';
      if (!DISPLAY_FIELD_TYPES.has(type) && type) {
        columns.push({
          id: el.name ?? el.id ?? '',
          label: el.label || el.name || el.id || 'Field',
          type,
        });
      }
    }
  }

  return columns;
}

/**
 * Maps a form field type string → SheetColumn type enum value.
 * number/rating → NUMBER
 * date/datetime → DATE
 * checkbox/toggle/select/radio → STATUS
 * else → TEXT
 */
export function mapFieldTypeToColumnType(fieldType: string): string {
  if (['number', 'rating', 'scale'].includes(fieldType)) return 'NUMBER';
  if (['date', 'datetime', 'time'].includes(fieldType)) return 'DATE';
  if (['checkbox', 'toggle', 'select', 'radio'].includes(fieldType)) return 'STATUS';
  return 'TEXT';
}
