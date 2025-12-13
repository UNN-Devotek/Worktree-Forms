import { ConditionalOperator } from '@/types/group-forms'

export type ComparisonOperator = ConditionalOperator

/**
 * Compare two values using the specified operator
 */
export function compareValues(
  fieldValue: any,
  compareValue: any,
  operator: ComparisonOperator | string,
  fieldType: string
): boolean {
  // Normalize operator to snake_case format
  // First insert underscores before uppercase letters, then remove any leading underscore, then lowercase
  const normalizedOp = operator
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase() as ComparisonOperator

  // Special handling for contains/not_contains with arrays (checkbox fields)
  // Don't normalize compareValue for these cases
  if ((normalizedOp === 'contains' || normalizedOp === 'not_contains') && Array.isArray(fieldValue)) {
    if (normalizedOp === 'contains') {
      return fieldValue.includes(compareValue)
    } else {
      return !fieldValue.includes(compareValue)
    }
  }

  // Special handling for in/not_in operators
  // Don't normalize fieldValue for these cases
  if ((normalizedOp === 'in' || normalizedOp === 'not_in') && Array.isArray(compareValue)) {
    if (normalizedOp === 'in') {
      return compareValue.includes(fieldValue)
    } else {
      return !compareValue.includes(fieldValue)
    }
  }

  // Normalize values for comparison
  const normalizedFieldValue = normalizeValue(fieldValue, fieldType)
  const normalizedCompareValue = normalizeValue(compareValue, fieldType)

  switch (normalizedOp) {
    case 'equals':
      return normalizedFieldValue === normalizedCompareValue

    case 'not_equals':
      return normalizedFieldValue !== normalizedCompareValue

    case 'contains':
      if (Array.isArray(normalizedFieldValue)) {
        return normalizedFieldValue.includes(normalizedCompareValue)
      }
      return String(normalizedFieldValue).includes(String(normalizedCompareValue))

    case 'not_contains':
      if (Array.isArray(normalizedFieldValue)) {
        return !normalizedFieldValue.includes(normalizedCompareValue)
      }
      return !String(normalizedFieldValue).includes(String(normalizedCompareValue))

    case 'greater_than':
      return Number(normalizedFieldValue) > Number(normalizedCompareValue)

    case 'less_than':
      return Number(normalizedFieldValue) < Number(normalizedCompareValue)

    case 'greater_than_or_equal':
      return Number(normalizedFieldValue) >= Number(normalizedCompareValue)

    case 'less_than_or_equal':
      return Number(normalizedFieldValue) <= Number(normalizedCompareValue)

    case 'starts_with':
      return String(normalizedFieldValue).startsWith(String(normalizedCompareValue))

    case 'ends_with':
      return String(normalizedFieldValue).endsWith(String(normalizedCompareValue))

    case 'in':
      if (Array.isArray(normalizedCompareValue)) {
        return normalizedCompareValue.includes(normalizedFieldValue)
      }
      return false

    case 'not_in':
      if (Array.isArray(normalizedCompareValue)) {
        return !normalizedCompareValue.includes(normalizedFieldValue)
      }
      return true

    case 'is_empty':
      // Check if value is null or undefined
      if (normalizedFieldValue === null || normalizedFieldValue === undefined) {
        return true
      }
      // Check if value is an empty array
      if (Array.isArray(normalizedFieldValue)) {
        return normalizedFieldValue.length === 0
      }
      // Check if value is an empty string (after String coercion)
      return String(normalizedFieldValue).trim() === ''

    case 'is_not_empty':
      // Check if value is null or undefined
      if (normalizedFieldValue === null || normalizedFieldValue === undefined) {
        return false
      }
      // Check if value is an empty array
      if (Array.isArray(normalizedFieldValue)) {
        return normalizedFieldValue.length > 0
      }
      // Check if value is an empty string (after String coercion)
      return String(normalizedFieldValue).trim() !== ''

    default:
      return false
  }
}

/**
 * Normalize value based on field type
 */
function normalizeValue(value: any, fieldType: string): any {
  if (value === null || value === undefined) {
    return null
  }

  switch (fieldType) {
    case 'number':
      return Number(value)

    case 'checkbox':
      // Checkbox returns array of selected values
      // But don't wrap booleans or null/undefined
      if (typeof value === 'boolean' || value === null || value === undefined) {
        return value
      }
      return Array.isArray(value) ? value : [value]

    case 'date': {
      const dateTime = new Date(value).getTime()
      return isNaN(dateTime) ? null : dateTime
    }

    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
    case 'url':
      return String(value).toLowerCase().trim()

    default:
      return value
  }
}

/**
 * Get available operators for a field type
 */
export function getOperatorsForFieldType(fieldType: string): ComparisonOperator[] {
  const textOperators: ComparisonOperator[] = [
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'is_empty',
    'is_not_empty'
  ]

  const numberOperators: ComparisonOperator[] = [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'is_empty',
    'is_not_empty'
  ]

  const selectionOperators: ComparisonOperator[] = [
    'equals',
    'not_equals',
    'in',
    'not_in',
    'is_empty',
    'is_not_empty'
  ]

  const dateOperators: ComparisonOperator[] = [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'is_empty',
    'is_not_empty'
  ]

  switch (fieldType) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
    case 'url':
      return textOperators

    case 'number':
      return numberOperators

    case 'radio':
    case 'select':
      return selectionOperators

    case 'checkbox':
      return ['contains', 'not_contains', 'is_empty', 'is_not_empty']

    case 'date':
      return dateOperators

    default:
      return ['equals', 'not_equals', 'is_empty', 'is_not_empty']
  }
}
