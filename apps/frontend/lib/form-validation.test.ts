import { describe, it, expect } from 'vitest';
import { generateZodSchema } from './form-validation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSchema(fields: any[]) {
  return {
    pages: [
      {
        sections: [
          { fields },
        ],
      },
    ],
  };
}

function field(overrides: Record<string, any>) {
  return {
    id: overrides.name ?? 'f1',
    name: overrides.name ?? 'f1',
    label: overrides.label ?? 'Field',
    type: overrides.type ?? 'text',
    required: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateZodSchema — field types
// ---------------------------------------------------------------------------

describe('generateZodSchema', () => {
  describe('text / textarea / url', () => {
    it('[P0] required text field rejects empty string', () => {
      const schema = generateZodSchema(makeSchema([field({ name: 'name', type: 'text', required: true })]));
      expect(schema.safeParse({ name: '' }).success).toBe(false);
      expect(schema.safeParse({ name: 'Alice' }).success).toBe(true);
    });

    it('[P0] optional text field allows absence', () => {
      const schema = generateZodSchema(makeSchema([field({ name: 'note', type: 'text', required: false })]));
      expect(schema.safeParse({}).success).toBe(true);
    });

    it('[P0] minLength enforced on text', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'bio', type: 'text', required: true, minLength: 10 })])
      );
      expect(schema.safeParse({ bio: 'short' }).success).toBe(false);
      expect(schema.safeParse({ bio: 'long enough string' }).success).toBe(true);
    });

    it('[P0] maxLength enforced on text', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'bio', type: 'text', required: true, maxLength: 5 })])
      );
      expect(schema.safeParse({ bio: 'toolong' }).success).toBe(false);
      expect(schema.safeParse({ bio: 'ok' }).success).toBe(true);
    });
  });

  describe('email', () => {
    it('[P0] rejects invalid email format', () => {
      const schema = generateZodSchema(makeSchema([field({ name: 'email', type: 'email', required: true })]));
      expect(schema.safeParse({ email: 'not-an-email' }).success).toBe(false);
      expect(schema.safeParse({ email: 'user@example.com' }).success).toBe(true);
    });
  });

  describe('phone', () => {
    it('[P0] accepts valid phone number formats', () => {
      const schema = generateZodSchema(makeSchema([field({ name: 'phone', type: 'phone', required: true })]));
      expect(schema.safeParse({ phone: '+1 (555) 123-4567' }).success).toBe(true);
    });

    it('[P0] rejects phone with letters', () => {
      const schema = generateZodSchema(makeSchema([field({ name: 'phone', type: 'phone', required: true })]));
      expect(schema.safeParse({ phone: 'call me' }).success).toBe(false);
    });
  });

  describe('number / rating / scale', () => {
    it('[P0] rejects non-number for number type', () => {
      const schema = generateZodSchema(makeSchema([field({ name: 'age', type: 'number', required: true })]));
      expect(schema.safeParse({ age: 'abc' }).success).toBe(false);
    });

    it('[P0] enforces min value', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'age', type: 'number', required: true, min: 18 })])
      );
      expect(schema.safeParse({ age: 10 }).success).toBe(false);
      expect(schema.safeParse({ age: 18 }).success).toBe(true);
    });

    it('[P0] enforces max value', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'score', type: 'number', required: true, max: 100 })])
      );
      expect(schema.safeParse({ score: 101 }).success).toBe(false);
      expect(schema.safeParse({ score: 100 }).success).toBe(true);
    });
  });

  describe('radio / select', () => {
    it('[P0] accepts only defined choices', () => {
      const schema = generateZodSchema(
        makeSchema([
          field({
            name: 'color',
            type: 'radio',
            required: true,
            choices: [{ value: 'red' }, { value: 'blue' }],
          }),
        ])
      );
      expect(schema.safeParse({ color: 'red' }).success).toBe(true);
      expect(schema.safeParse({ color: 'green' }).success).toBe(false);
    });

    it('[P1] falls back to z.string() when no choices are defined', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'choice', type: 'select', required: true, choices: [] })])
      );
      expect(schema.safeParse({ choice: 'anything' }).success).toBe(true);
    });
  });

  describe('checkbox', () => {
    it('[P0] multi-checkbox with required: true requires at least one item', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'tags', type: 'checkbox', required: true, allowMultiple: true })])
      );
      expect(schema.safeParse({ tags: [] }).success).toBe(false);
      expect(schema.safeParse({ tags: ['a'] }).success).toBe(true);
    });

    it('[P0] multi-checkbox with required: false allows empty array', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'tags', type: 'checkbox', required: false, allowMultiple: true })])
      );
      expect(schema.safeParse({ tags: [] }).success).toBe(true);
    });

    it('[P1] single checkbox (no allowMultiple) is boolean', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'agree', type: 'checkbox', required: true })])
      );
      expect(schema.safeParse({ agree: true }).success).toBe(true);
      expect(schema.safeParse({ agree: false }).success).toBe(true);
    });
  });

  describe('date / time / datetime', () => {
    it('[P0] accepts any string for date type', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'dob', type: 'date', required: true })])
      );
      expect(schema.safeParse({ dob: '2025-01-15' }).success).toBe(true);
    });
  });

  describe('address', () => {
    it('[P0] accepts an address object with optional fields', () => {
      const schema = generateZodSchema(
        makeSchema([field({ name: 'addr', type: 'address', required: true })])
      );
      expect(schema.safeParse({ addr: { street: '123 Main', city: 'NYC' } }).success).toBe(true);
      expect(schema.safeParse({ addr: {} }).success).toBe(true);
    });
  });

  // ─── custom validation rules ─────────────────────────────────────────────

  describe('custom validation rules', () => {
    it('[P0] min_length rule enforced on text', () => {
      const schema = generateZodSchema(
        makeSchema([
          field({
            name: 'desc',
            type: 'text',
            required: true,
            validation: [{ type: 'min_length', value: 8, message: 'Too short' }],
          }),
        ])
      );
      expect(schema.safeParse({ desc: 'hi' }).success).toBe(false);
      expect(schema.safeParse({ desc: 'long enough' }).success).toBe(true);
    });

    it('[P0] max_length rule enforced on text', () => {
      const schema = generateZodSchema(
        makeSchema([
          field({
            name: 'tag',
            type: 'text',
            required: true,
            validation: [{ type: 'max_length', value: 5 }],
          }),
        ])
      );
      expect(schema.safeParse({ tag: 'toolong' }).success).toBe(false);
      expect(schema.safeParse({ tag: 'ok' }).success).toBe(true);
    });

    it('[P0] pattern rule validates against regex', () => {
      const schema = generateZodSchema(
        makeSchema([
          field({
            name: 'code',
            type: 'text',
            required: true,
            validation: [{ type: 'pattern', value: '^[A-Z]{3}$' }],
          }),
        ])
      );
      expect(schema.safeParse({ code: 'ABC' }).success).toBe(true);
      expect(schema.safeParse({ code: 'abc' }).success).toBe(false);
    });

    it('[P1] invalid or empty pattern is skipped (no crash)', () => {
      const schema = generateZodSchema(
        makeSchema([
          field({
            name: 'x',
            type: 'text',
            required: true,
            validation: [{ type: 'pattern', value: '' }],
          }),
        ])
      );
      // empty pattern → null from safeCompileRegex → skip validation
      expect(schema.safeParse({ x: 'anything' }).success).toBe(true);
    });

    it('[P0] min_value rule on number', () => {
      const schema = generateZodSchema(
        makeSchema([
          field({
            name: 'qty',
            type: 'number',
            required: true,
            validation: [{ type: 'min_value', value: 1 }],
          }),
        ])
      );
      expect(schema.safeParse({ qty: 0 }).success).toBe(false);
      expect(schema.safeParse({ qty: 1 }).success).toBe(true);
    });

    it('[P0] max_value rule on number', () => {
      const schema = generateZodSchema(
        makeSchema([
          field({
            name: 'qty',
            type: 'number',
            required: true,
            validation: [{ type: 'max_value', value: 10 }],
          }),
        ])
      );
      expect(schema.safeParse({ qty: 11 }).success).toBe(false);
      expect(schema.safeParse({ qty: 10 }).success).toBe(true);
    });
  });

  // ─── multi-page / multi-section ──────────────────────────────────────────

  describe('multi-page schema', () => {
    it('[P1] collects fields from multiple pages and sections', () => {
      const formSchema = {
        pages: [
          { sections: [{ fields: [field({ name: 'first_name', type: 'text', required: true })] }] },
          { sections: [{ fields: [field({ name: 'email', type: 'email', required: true })] }] },
        ],
      };

      const schema = generateZodSchema(formSchema as any);
      // Both fields must be present
      expect(schema.safeParse({ first_name: 'Alice', email: 'alice@example.com' }).success).toBe(true);
      expect(schema.safeParse({ first_name: '', email: 'alice@example.com' }).success).toBe(false);
      expect(schema.safeParse({ first_name: 'Alice', email: 'bad' }).success).toBe(false);
    });
  });
});
