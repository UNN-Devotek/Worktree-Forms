import { describe, it, expect } from 'vitest';
import { compareValues, getOperatorsForFieldType } from './operators';
import { evaluateCondition } from './evaluator';
import { calculateFormula, validateFormula, getFormulaFieldReferences } from './calculator';
import { executeAction } from './actions';
import { ConditionalLogicEngine } from './engine';
import type { LogicState } from './engine';

// ---------------------------------------------------------------------------
// compareValues
// ---------------------------------------------------------------------------

describe('compareValues', () => {
  // equals / not_equals
  describe('equals / not_equals', () => {
    it('[P0] equals — matching string values', () => {
      expect(compareValues('hello', 'hello', 'equals', 'text')).toBe(true);
    });

    it('[P0] equals — normalizes text to lowercase', () => {
      expect(compareValues('Hello', 'hello', 'equals', 'text')).toBe(true);
    });

    it('[P0] equals — mismatching strings', () => {
      expect(compareValues('hello', 'world', 'equals', 'text')).toBe(false);
    });

    it('[P0] not_equals — different values', () => {
      expect(compareValues('a', 'b', 'not_equals', 'text')).toBe(true);
    });

    it('[P0] equals — number type coercion', () => {
      expect(compareValues('42', 42, 'equals', 'number')).toBe(true);
    });
  });

  // contains / not_contains
  describe('contains / not_contains', () => {
    it('[P0] contains — substring match', () => {
      expect(compareValues('hello world', 'world', 'contains', 'text')).toBe(true);
    });

    it('[P0] not_contains — substring absent', () => {
      expect(compareValues('hello world', 'foo', 'not_contains', 'text')).toBe(true);
    });

    it('[P0] contains — array field value (checkbox)', () => {
      expect(compareValues(['a', 'b', 'c'], 'b', 'contains', 'checkbox')).toBe(true);
    });

    it('[P0] not_contains — item not in array', () => {
      expect(compareValues(['a', 'b'], 'c', 'not_contains', 'checkbox')).toBe(true);
    });
  });

  // numeric comparisons
  describe('numeric comparisons', () => {
    it('[P0] greater_than — true case', () => {
      expect(compareValues(10, 5, 'greater_than', 'number')).toBe(true);
    });

    it('[P0] greater_than — false case', () => {
      expect(compareValues(3, 5, 'greater_than', 'number')).toBe(false);
    });

    it('[P0] less_than — true case', () => {
      expect(compareValues(3, 5, 'less_than', 'number')).toBe(true);
    });

    it('[P0] greater_than_or_equal — equal boundary', () => {
      expect(compareValues(5, 5, 'greater_than_or_equal', 'number')).toBe(true);
    });

    it('[P0] less_than_or_equal — equal boundary', () => {
      expect(compareValues(5, 5, 'less_than_or_equal', 'number')).toBe(true);
    });
  });

  // starts_with / ends_with
  describe('starts_with / ends_with', () => {
    it('[P0] starts_with — true', () => {
      expect(compareValues('hello world', 'hello', 'starts_with', 'text')).toBe(true);
    });

    it('[P0] starts_with — false', () => {
      expect(compareValues('hello world', 'world', 'starts_with', 'text')).toBe(false);
    });

    it('[P0] ends_with — true', () => {
      expect(compareValues('hello world', 'world', 'ends_with', 'text')).toBe(true);
    });
  });

  // in / not_in
  describe('in / not_in', () => {
    it('[P0] in — value present in compare array', () => {
      expect(compareValues('b', ['a', 'b', 'c'], 'in', 'select')).toBe(true);
    });

    it('[P0] not_in — value absent from compare array', () => {
      expect(compareValues('z', ['a', 'b', 'c'], 'not_in', 'select')).toBe(true);
    });

    it('[P1] in — non-array compareValue returns false', () => {
      expect(compareValues('a', 'a', 'in', 'select')).toBe(false);
    });
  });

  // is_empty / is_not_empty
  describe('is_empty / is_not_empty', () => {
    it('[P0] is_empty — null value', () => {
      expect(compareValues(null, undefined, 'is_empty', 'text')).toBe(true);
    });

    it('[P0] is_empty — empty string', () => {
      expect(compareValues('', undefined, 'is_empty', 'text')).toBe(true);
    });

    it('[P0] is_empty — empty array', () => {
      expect(compareValues([], undefined, 'is_empty', 'checkbox')).toBe(true);
    });

    it('[P0] is_not_empty — non-empty string', () => {
      expect(compareValues('hello', undefined, 'is_not_empty', 'text')).toBe(true);
    });

    it('[P0] is_not_empty — non-empty array', () => {
      expect(compareValues(['a'], undefined, 'is_not_empty', 'checkbox')).toBe(true);
    });

    it('[P1] is_empty — whitespace-only string counts as empty', () => {
      expect(compareValues('   ', undefined, 'is_empty', 'text')).toBe(true);
    });
  });

  // date comparisons
  describe('date comparisons', () => {
    it('[P0] greater_than — later date is greater', () => {
      expect(compareValues('2025-06-01', '2025-01-01', 'greater_than', 'date')).toBe(true);
    });

    it('[P0] less_than — earlier date is less', () => {
      expect(compareValues('2025-01-01', '2025-06-01', 'less_than', 'date')).toBe(true);
    });

    it('[P1] invalid date normalizes to null (equals null)', () => {
      expect(compareValues('not-a-date', null, 'equals', 'date')).toBe(true);
    });
  });

  // camelCase operator normalization
  describe('camelCase operator normalization', () => {
    it('[P1] greaterThan normalizes to greater_than', () => {
      expect(compareValues(10, 5, 'greaterThan', 'number')).toBe(true);
    });

    it('[P1] notEquals normalizes to not_equals', () => {
      expect(compareValues('a', 'b', 'notEquals', 'text')).toBe(true);
    });
  });

  // unknown operator
  it('[P1] unknown operator returns false', () => {
    expect(compareValues('a', 'a', 'nonexistent_op', 'text')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getOperatorsForFieldType
// ---------------------------------------------------------------------------

describe('getOperatorsForFieldType', () => {
  it('[P0] text fields have text operators', () => {
    const ops = getOperatorsForFieldType('text');
    expect(ops).toContain('contains');
    expect(ops).toContain('starts_with');
    expect(ops).toContain('ends_with');
    expect(ops).not.toContain('greater_than');
  });

  it('[P0] number fields have numeric operators', () => {
    const ops = getOperatorsForFieldType('number');
    expect(ops).toContain('greater_than');
    expect(ops).toContain('less_than');
    expect(ops).not.toContain('starts_with');
  });

  it('[P0] checkbox fields have contains operators', () => {
    const ops = getOperatorsForFieldType('checkbox');
    expect(ops).toContain('contains');
    expect(ops).toContain('not_contains');
    expect(ops).not.toContain('greater_than');
  });

  it('[P0] select fields have in/not_in operators', () => {
    const ops = getOperatorsForFieldType('select');
    expect(ops).toContain('in');
    expect(ops).toContain('not_in');
  });

  it('[P1] unknown field type falls back to equals/not_equals/is_empty/is_not_empty', () => {
    const ops = getOperatorsForFieldType('unknown_type');
    expect(ops).toContain('equals');
    expect(ops).toContain('not_equals');
  });
});

// ---------------------------------------------------------------------------
// evaluateCondition
// ---------------------------------------------------------------------------

describe('evaluateCondition', () => {
  const textField = { id: 'f1', name: 'name', type: 'text', label: 'Name' } as any;
  const numberField = { id: 'f2', name: 'score', type: 'number', label: 'Score' } as any;

  it('[P0] is_empty — returns true for empty string without calling compareValues', () => {
    const result = evaluateCondition({ operator: 'is_empty', value: undefined } as any, '', textField);
    expect(result).toBe(true);
  });

  it('[P0] is_empty — returns false for non-empty value', () => {
    const result = evaluateCondition({ operator: 'is_empty', value: undefined } as any, 'hello', textField);
    expect(result).toBe(false);
  });

  it('[P0] is_not_empty — returns true for non-empty value', () => {
    const result = evaluateCondition({ operator: 'is_not_empty', value: undefined } as any, 'hello', textField);
    expect(result).toBe(true);
  });

  it('[P0] is_not_empty — returns false for null', () => {
    const result = evaluateCondition({ operator: 'is_not_empty', value: undefined } as any, null, textField);
    expect(result).toBe(false);
  });

  it('[P0] delegates to compareValues for other operators', () => {
    const result = evaluateCondition(
      { operator: 'greater_than', value: 5 } as any,
      10,
      numberField
    );
    expect(result).toBe(true);
  });

  it('[P0] equals — text normalization via compareValues', () => {
    const result = evaluateCondition(
      { operator: 'equals', value: 'alice' } as any,
      'Alice',
      textField
    );
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calculateFormula
// ---------------------------------------------------------------------------

describe('calculateFormula', () => {
  it('[P0] substitutes field refs and evaluates arithmetic', () => {
    const result = calculateFormula('{price} + {tax}', { price: 100, tax: 20 });
    expect(result).toBe(120);
  });

  it('[P0] handles multiplication', () => {
    const result = calculateFormula('{qty} * {price}', { qty: 3, price: 25 });
    expect(result).toBe(75);
  });

  it('[P0] missing field defaults to 0', () => {
    const result = calculateFormula('{a} + {b}', { a: 10 });
    expect(result).toBe(10);
  });

  it('[P0] handles double-brace refs {{field}}', () => {
    const result = calculateFormula('{{total}} - {{discount}}', { total: 100, discount: 15 });
    expect(result).toBe(85);
  });

  it('[P1] division works', () => {
    const result = calculateFormula('{a} / {b}', { a: 10, b: 4 });
    expect(result).toBeCloseTo(2.5);
  });

  it('[P1] complex expression with parentheses', () => {
    const result = calculateFormula('({a} + {b}) * {c}', { a: 2, b: 3, c: 4 });
    expect(result).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// validateFormula
// ---------------------------------------------------------------------------

describe('validateFormula', () => {
  it('[P0] valid formula returns { valid: true }', () => {
    expect(validateFormula('{price} + {tax}').valid).toBe(true);
  });

  it('[P0] unbalanced { returns invalid', () => {
    expect(validateFormula('{price + {tax}').valid).toBe(false);
  });

  it('[P0] unbalanced parentheses returns invalid', () => {
    const result = validateFormula('{a} * ({b} + {c}');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/parenthes/i);
  });

  it('[P0] formula with no field references returns invalid', () => {
    const result = validateFormula('1 + 2');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/no field references/i);
  });
});

// ---------------------------------------------------------------------------
// getFormulaFieldReferences
// ---------------------------------------------------------------------------

describe('getFormulaFieldReferences', () => {
  it('[P0] extracts single field reference', () => {
    expect(getFormulaFieldReferences('{price}')).toEqual(['price']);
  });

  it('[P0] extracts multiple field references', () => {
    const refs = getFormulaFieldReferences('{a} + {b} * {c}');
    expect(refs).toEqual(['a', 'b', 'c']);
  });

  it('[P0] returns empty array for no refs', () => {
    expect(getFormulaFieldReferences('1 + 2')).toEqual([]);
  });

  it('[P1] strips double-brace wrappers', () => {
    expect(getFormulaFieldReferences('{{total}}')).toEqual(['total']);
  });
});

// ---------------------------------------------------------------------------
// executeAction
// ---------------------------------------------------------------------------

describe('executeAction', () => {
  function makeState(): LogicState {
    return {
      visibleFields: new Set(['f1', 'f2', 'f3']),
      enabledFields: new Set(['f1', 'f2', 'f3']),
      calculatedValues: {},
    };
  }

  it('[P0] hide — removes field from visibleFields', () => {
    const state = makeState();
    executeAction('hide', ['f2'], state);
    expect(state.visibleFields.has('f2')).toBe(false);
    expect(state.visibleFields.has('f1')).toBe(true);
  });

  it('[P0] show — adds field to visibleFields', () => {
    const state = makeState();
    state.visibleFields.delete('f2');
    executeAction('show', ['f2'], state);
    expect(state.visibleFields.has('f2')).toBe(true);
  });

  it('[P0] disable — removes field from enabledFields', () => {
    const state = makeState();
    executeAction('disable', ['f3'], state);
    expect(state.enabledFields.has('f3')).toBe(false);
  });

  it('[P0] enable — adds field to enabledFields', () => {
    const state = makeState();
    state.enabledFields.delete('f3');
    executeAction('enable', ['f3'], state);
    expect(state.enabledFields.has('f3')).toBe(true);
  });

  it('[P1] hide — targets multiple fields at once', () => {
    const state = makeState();
    executeAction('hide', ['f1', 'f2'], state);
    expect(state.visibleFields.has('f1')).toBe(false);
    expect(state.visibleFields.has('f2')).toBe(false);
    expect(state.visibleFields.has('f3')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ConditionalLogicEngine
// ---------------------------------------------------------------------------

describe('ConditionalLogicEngine', () => {
  const fields = [
    { id: 'f1', name: 'role', type: 'select', label: 'Role', conditionalLogic: [] },
    {
      id: 'f2',
      name: 'salary',
      type: 'number',
      label: 'Salary',
      conditionalLogic: [
        {
          condition: { fieldId: 'f1', operator: 'equals', value: 'manager' },
          action: 'show',
          targetFieldIds: ['f2'],
        },
      ],
    },
    { id: 'f3', name: 'notes', type: 'text', label: 'Notes', conditionalLogic: [] },
  ] as any[];

  it('[P0] all fields visible/enabled by default', () => {
    const engine = new ConditionalLogicEngine(fields);
    expect(engine.isFieldVisible('f1')).toBe(true);
    expect(engine.isFieldEnabled('f1')).toBe(true);
  });

  it('[P0] evaluate — show action fires when condition is met', () => {
    const hideFirst = [
      { id: 'f1', name: 'category', type: 'select', label: 'Category', conditionalLogic: [] },
      {
        id: 'f2',
        name: 'subcategory',
        type: 'text',
        label: 'Subcategory',
        conditionalLogic: [
          {
            condition: { fieldId: 'f1', operator: 'equals', value: 'other' },
            action: 'hide',
            targetFieldIds: ['f2'],
          },
        ],
      },
    ] as any[];

    const engine = new ConditionalLogicEngine(hideFirst);
    const state = engine.evaluate({ category: 'other' });
    expect(state.visibleFields.has('f2')).toBe(false);
  });

  it('[P0] evaluate — action does NOT fire when condition is not met', () => {
    const hideFirst = [
      { id: 'f1', name: 'category', type: 'select', label: 'Category', conditionalLogic: [] },
      {
        id: 'f2',
        name: 'subcategory',
        type: 'text',
        label: 'Subcategory',
        conditionalLogic: [
          {
            condition: { fieldId: 'f1', operator: 'equals', value: 'other' },
            action: 'hide',
            targetFieldIds: ['f2'],
          },
        ],
      },
    ] as any[];

    const engine = new ConditionalLogicEngine(hideFirst);
    const state = engine.evaluate({ category: 'standard' });
    expect(state.visibleFields.has('f2')).toBe(true);
  });

  it('[P1] evaluate — AND logic: all conditions must be true', () => {
    const andFields = [
      { id: 'f1', name: 'type', type: 'select', label: 'Type', conditionalLogic: [] },
      { id: 'f2', name: 'age', type: 'number', label: 'Age', conditionalLogic: [] },
      {
        id: 'f3',
        name: 'premium',
        type: 'text',
        label: 'Premium',
        conditionalLogic: [
          {
            conditions: [
              { fieldId: 'f1', operator: 'equals', value: 'vip' },
              { fieldId: 'f2', operator: 'greater_than', value: 18 },
            ],
            logicOperator: 'and',
            action: 'show',
            targetFieldIds: ['f3'],
          },
        ],
      },
    ] as any[];

    const engine = new ConditionalLogicEngine(andFields);

    // Both conditions met → show fires (f3 stays visible)
    let state = engine.evaluate({ type: 'vip', age: 25 });
    expect(state.visibleFields.has('f3')).toBe(true);

    // Only one met → show does NOT fire; but since show adds, and we start visible,
    // nothing changes unless the action is hide. Let's test with hide:
    const andHide = [
      { id: 'f1', name: 'type', type: 'select', label: 'Type', conditionalLogic: [] },
      { id: 'f2', name: 'age', type: 'number', label: 'Age', conditionalLogic: [] },
      {
        id: 'f3',
        name: 'premium',
        type: 'text',
        label: 'Premium',
        conditionalLogic: [
          {
            conditions: [
              { fieldId: 'f1', operator: 'equals', value: 'vip' },
              { fieldId: 'f2', operator: 'greater_than', value: 18 },
            ],
            logicOperator: 'and',
            action: 'hide',
            targetFieldIds: ['f3'],
          },
        ],
      },
    ] as any[];

    const engine2 = new ConditionalLogicEngine(andHide);
    state = engine2.evaluate({ type: 'vip', age: 10 }); // age fails
    expect(state.visibleFields.has('f3')).toBe(true); // not hidden

    state = engine2.evaluate({ type: 'vip', age: 25 }); // both pass
    expect(state.visibleFields.has('f3')).toBe(false); // hidden
  });

  it('[P1] evaluate — OR logic: any condition being true triggers action', () => {
    const orFields = [
      { id: 'f1', name: 'source', type: 'select', label: 'Source', conditionalLogic: [] },
      { id: 'f2', name: 'medium', type: 'text', label: 'Medium', conditionalLogic: [] },
      {
        id: 'f3',
        name: 'extra',
        type: 'text',
        label: 'Extra',
        conditionalLogic: [
          {
            conditions: [
              { fieldId: 'f1', operator: 'equals', value: 'ads' },
              { fieldId: 'f2', operator: 'equals', value: 'email' },
            ],
            logicOperator: 'or',
            action: 'hide',
            targetFieldIds: ['f3'],
          },
        ],
      },
    ] as any[];

    const engine = new ConditionalLogicEngine(orFields);
    // Only source = ads matches
    let state = engine.evaluate({ source: 'ads', medium: 'sms' });
    expect(state.visibleFields.has('f3')).toBe(false); // hidden because OR succeeded

    // Neither matches → not hidden
    state = engine.evaluate({ source: 'organic', medium: 'sms' });
    expect(state.visibleFields.has('f3')).toBe(true);
  });

  it('[P1] state resets between evaluate calls', () => {
    const hideFields = [
      { id: 'f1', name: 'flag', type: 'select', label: 'Flag', conditionalLogic: [] },
      {
        id: 'f2',
        name: 'secret',
        type: 'text',
        label: 'Secret',
        conditionalLogic: [
          {
            condition: { fieldId: 'f1', operator: 'equals', value: 'yes' },
            action: 'hide',
            targetFieldIds: ['f2'],
          },
        ],
      },
    ] as any[];

    const engine = new ConditionalLogicEngine(hideFields);
    engine.evaluate({ flag: 'yes' }); // hides f2
    const state = engine.evaluate({ flag: 'no' }); // should restore
    expect(state.visibleFields.has('f2')).toBe(true);
  });

  it('[P1] unknown fieldId in condition returns false (does not throw)', () => {
    const badFields = [
      {
        id: 'f1',
        name: 'x',
        type: 'text',
        label: 'X',
        conditionalLogic: [
          {
            condition: { fieldId: 'NONEXISTENT', operator: 'equals', value: 'abc' },
            action: 'hide',
            targetFieldIds: ['f1'],
          },
        ],
      },
    ] as any[];

    const engine = new ConditionalLogicEngine(badFields);
    expect(() => engine.evaluate({ x: 'abc' })).not.toThrow();
    expect(engine.isFieldVisible('f1')).toBe(true);
  });
});
