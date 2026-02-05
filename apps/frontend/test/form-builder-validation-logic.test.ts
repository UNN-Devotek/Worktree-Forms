import { describe, it, expect } from 'vitest';
import { FormSchema, ValidationRule, ConditionalRule } from '@/types/group-forms';

describe('Form Builder - Validation & Conditional Logic', () => {
  describe('Validation Rules', () => {
    it('should support required field validation', () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'This field is required',
      };

      expect(rule.type).toBe('required');
      expect(rule.message).toBeDefined();
    });

    it('should support min/max length validation', () => {
      const minRule: ValidationRule = {
        type: 'min_length',
        value: 5,
        message: 'Minimum 5 characters',
      };

      const maxRule: ValidationRule = {
        type: 'max_length',
        value: 100,
        message: 'Maximum 100 characters',
      };

      expect(minRule.value).toBe(5);
      expect(maxRule.value).toBe(100);
    });

    it('should support regex pattern validation', () => {
      const rule: ValidationRule = {
        type: 'pattern',
        value: '^[A-Z][a-z]+$',
        message: 'Must start with uppercase letter',
      };

      expect(rule.type).toBe('pattern');
      expect(rule.value).toMatch(/^\^/); // Starts with ^
    });

    it('should support email validation', () => {
      const rule: ValidationRule = {
        type: 'email',
        message: 'Invalid email format',
      };

      expect(rule.type).toBe('email');
    });

    it('should support file size validation', () => {
      const rule: ValidationRule = {
        type: 'file_size',
        maxFileSize: 5242880, // 5MB
        message: 'File too large (max 5MB)',
      };

      expect(rule.maxFileSize).toBe(5242880);
    });

    it('should support multiple validation rules on a field', () => {
      const field = {
        id: 'email_field',
        type: 'email' as const,
        name: 'user_email',
        label: 'Email Address',
        required: true,
        validation: [
          { type: 'required' as const, message: 'Email is required' },
          { type: 'email' as const, message: 'Invalid email format' },
          { type: 'max_length' as const, value: 255, message: 'Email too long' },
        ],
      };

      expect(field.validation).toHaveLength(3);
      expect(field.validation![0].type).toBe('required');
      expect(field.validation![1].type).toBe('email');
      expect(field.validation![2].type).toBe('max_length');
    });
  });

  describe('Conditional Logic', () => {
    it('should support show/hide conditional actions', () => {
      const rule: ConditionalRule = {
        id: 'rule_1',
        condition: {
          fieldId: 'field_1',
          operator: 'equals',
          value: 'yes',
        },
        action: 'show',
        targetFieldIds: ['field_2', 'field_3'],
      };

      expect(rule.action).toBe('show');
      expect(rule.targetFieldIds).toHaveLength(2);
    });

    it('should support multiple conditions with AND logic', () => {
      const rule: ConditionalRule = {
        id: 'rule_2',
        conditions: [
          { fieldId: 'age', operator: 'greaterThan', value: 18 },
          { fieldId: 'country', operator: 'equals', value: 'US' },
        ],
        logicOperator: 'and',
        action: 'show',
        targetFieldIds: ['voter_registration'],
      };

      expect(rule.conditions).toHaveLength(2);
      expect(rule.logicOperator).toBe('and');
    });

    it('should support multiple conditions with OR logic', () => {
      const rule: ConditionalRule = {
        id: 'rule_3',
        conditions: [
          { fieldId: 'payment_method', operator: 'equals', value: 'credit_card' },
          { fieldId: 'payment_method', operator: 'equals', value: 'debit_card' },
        ],
        logicOperator: 'or',
        action: 'show',
        targetFieldIds: ['card_number', 'cvv'],
      };

      expect(rule.logicOperator).toBe('or');
      expect(rule.targetFieldIds).toHaveLength(2);
    });

    it('should support require/unrequire actions', () => {
      const requireRule: ConditionalRule = {
        id: 'rule_4',
        condition: {
          fieldId: 'has_dependents',
          operator: 'equals',
          value: true,
        },
        action: 'require',
        targetFieldIds: ['dependent_count'],
      };

      expect(requireRule.action).toBe('require');
    });

    it('should support skip page action', () => {
      const skipRule: ConditionalRule = {
        id: 'rule_5',
        condition: {
          fieldId: 'skip_section',
          operator: 'equals',
          value: 'yes',
        },
        action: 'skip',
        targetPageId: 'page_3',
      };

      expect(skipRule.action).toBe('skip');
      expect(skipRule.targetPageId).toBe('page_3');
    });

    it('should support all conditional operators', () => {
      const operators = [
        'equals',
        'notEquals',
        'contains',
        'notContains',
        'greaterThan',
        'lessThan',
        'greaterThanOrEqual',
        'lessThanOrEqual',
        'isEmpty',
        'isNotEmpty',
        'startsWith',
        'endsWith',
        'in',
        'not_in',
      ];

      operators.forEach((op) => {
        const rule: ConditionalRule = {
          id: `rule_${op}`,
          condition: {
            fieldId: 'test_field',
            operator: op as any,
            value: 'test',
          },
          action: 'show',
          targetFieldIds: ['target'],
        };

        expect(rule.condition?.operator).toBe(op);
      });
    });

    it('should support enable/disable actions', () => {
      const rule: ConditionalRule = {
        id: 'rule_6',
        condition: {
          fieldId: 'is_editable',
          operator: 'equals',
          value: false,
        },
        action: 'disable',
        targetFieldIds: ['edit_field'],
      };

      expect(rule.action).toBe('disable');
    });
  });

  describe('Integration - Validation + Conditional Logic', () => {
    it('should support field with both validation and conditional logic', () => {
      const field = {
        id: 'phone_field',
        type: 'phone' as const,
        name: 'phone_number',
        label: 'Phone Number',
        validation: [
          { type: 'required' as const, message: 'Phone is required' },
          { type: 'phone' as const, message: 'Invalid phone format' },
        ],
        conditionalLogic: [
          {
            id: 'show_phone',
            condition: {
              fieldId: 'contact_method',
              operator: 'equals' as const,
              value: 'phone',
            },
            action: 'show' as const,
            targetFieldIds: ['phone_field'],
          },
        ],
      };

      expect(field.validation).toHaveLength(2);
      expect(field.conditionalLogic).toHaveLength(1);
    });

    it('should support complex multi-page form with validation and logic', () => {
      const schema: FormSchema = {
        version: '2.0',
        pages: [
          {
            id: 'page_1',
            title: 'Personal Info',
            sections: [
              {
                id: 'section_1',
                fields: [
                  {
                    id: 'age',
                    type: 'number',
                    name: 'age',
                    label: 'Age',
                    required: true,
                    validation: [
                      { type: 'required', message: 'Age is required' },
                      { type: 'min_value', value: 18, message: 'Must be 18+' },
                      { type: 'max_value', value: 120, message: 'Invalid age' },
                    ],
                  },
                  {
                    id: 'student',
                    type: 'radio',
                    name: 'is_student',
                    label: 'Are you a student?',
                    choices: [
                      { value: 'yes', text: 'Yes' },
                      { value: 'no', text: 'No' },
                    ],
                  },
                  {
                    id: 'school',
                    type: 'text',
                    name: 'school_name',
                    label: 'School Name',
                    conditionalLogic: [
                      {
                        id: 'show_school',
                        condition: {
                          fieldId: 'student',
                          operator: 'equals',
                          value: 'yes',
                        },
                        action: 'show',
                        targetFieldIds: ['school'],
                      },
                    ],
                    validation: [
                      { type: 'required', message: 'School name is required' },
                    ],
                  },
                ],
              },
            ],
            order: 0,
          },
        ],
        settings: {
          renderMode: 'all-in-one',
          showProgress: true,
          allowSave: true,
          allowBack: true,
          successMessage: 'Thank you!',
        },
        theme: {
          mode: 'auto',
          show_logo: true,
        },
      };

      expect(schema.pages).toHaveLength(1);
      expect(schema.pages[0].sections[0].fields).toHaveLength(3);
      
      const ageField = schema.pages[0].sections[0].fields[0];
      expect(ageField.validation).toHaveLength(3);
      
      const schoolField = schema.pages[0].sections[0].fields[2];
      expect(schoolField.conditionalLogic).toHaveLength(1);
      expect(schoolField.validation).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty validation array', () => {
      const field = {
        id: 'field_1',
        type: 'text' as const,
        name: 'test',
        label: 'Test',
        validation: [],
      };

      expect(field.validation).toHaveLength(0);
    });

    it('should handle empty conditional logic array', () => {
      const field = {
        id: 'field_1',
        type: 'text' as const,
        name: 'test',
        label: 'Test',
        conditionalLogic: [],
      };

      expect(field.conditionalLogic).toHaveLength(0);
    });

    it('should handle undefined validation', () => {
      const field = {
        id: 'field_1',
        type: 'text' as const,
        name: 'test',
        label: 'Test',
      };

      expect(field.validation).toBeUndefined();
    });

    it('should handle snake_case operator variants', () => {
      const operators = [
        'not_equals',
        'not_contains',
        'greater_than',
        'less_than',
        'greater_than_or_equal',
        'less_than_or_equal',
        'is_empty',
        'is_not_empty',
        'starts_with',
        'ends_with',
      ];

      operators.forEach((op) => {
        const rule: ConditionalRule = {
          id: `rule_${op}`,
          condition: {
            fieldId: 'test',
            operator: op as any,
            value: 'test',
          },
          action: 'show',
          targetFieldIds: ['target'],
        };

        expect(rule.condition?.operator).toBe(op);
      });
    });
  });
});
