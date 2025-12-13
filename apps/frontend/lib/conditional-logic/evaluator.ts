import { Condition, FormFieldBase } from '@/types/group-forms'
import { compareValues } from './operators'

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: Condition,
  fieldValue: any,
  field: FormFieldBase
): boolean {
  const { operator, value } = condition

  // Handle empty/null values
  if (operator === 'is_empty') {
    return fieldValue === null || fieldValue === undefined || fieldValue === ''
  }

  if (operator === 'is_not_empty') {
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
  }

  // For other operators, compare values
  return compareValues(fieldValue, value, operator, field.type)
}
