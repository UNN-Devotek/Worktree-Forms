/**
 * Calculate field value from formula
 */
export function calculateFormula(
  formula: string,
  formValues: Record<string, any>
): number | string | null {
  try {
    // Replace field references with actual values
    let expression = formula

    // Match field references like {field_name} or {{field_name}}
    const fieldRefs = formula.match(/\{+([a-zA-Z_][a-zA-Z0-9_]*)\}+/g) || []

    fieldRefs.forEach(ref => {
      const fieldName = ref.replace(/\{+|\}+/g, '')
      const value = formValues[fieldName]

      // Replace with numeric value or 0 if undefined
      const numericValue = value !== undefined && value !== null ? Number(value) : 0
      expression = expression.replace(ref, String(numericValue))
    })

    // Evaluate the expression safely
    const result = evaluateExpression(expression)
    return result
  } catch (error) {
    console.error('Formula calculation error:', error)
    return null
  }
}

/**
 * Safely evaluate mathematical expression
 */
function evaluateExpression(expression: string): number {
  // Remove any non-math characters for security
  const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '')

  // Use Function constructor (safer than eval)
  // This is still potentially dangerous - consider using a proper math parser library
  // like math.js in production
  try {
    const fn = new Function(`return ${sanitized}`)
    const result = fn()
    return typeof result === 'number' ? result : 0
  } catch {
    return 0
  }
}

/**
 * Validate formula syntax
 */
export function validateFormula(formula: string): { valid: boolean; error?: string } {
  try {
    // Check for balanced brackets
    const openBrackets = (formula.match(/\{/g) || []).length
    const closeBrackets = (formula.match(/\}/g) || []).length

    if (openBrackets !== closeBrackets) {
      return { valid: false, error: 'Unbalanced brackets in formula' }
    }

    // Check for balanced parentheses
    const openParens = (formula.match(/\(/g) || []).length
    const closeParens = (formula.match(/\)/g) || []).length

    if (openParens !== closeParens) {
      return { valid: false, error: 'Unbalanced parentheses in formula' }
    }

    // Check for valid field references
    const fieldRefs = formula.match(/\{+([a-zA-Z_][a-zA-Z0-9_]*)\}+/g) || []
    if (fieldRefs.length === 0) {
      return { valid: false, error: 'No field references found in formula' }
    }

    // Try to evaluate with dummy values
    const testFormula = formula.replace(/\{+[a-zA-Z_][a-zA-Z0-9_]*\}+/g, '1')
    evaluateExpression(testFormula)

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid formula syntax' }
  }
}

/**
 * Get field references from formula
 */
export function getFormulaFieldReferences(formula: string): string[] {
  const fieldRefs = formula.match(/\{+([a-zA-Z_][a-zA-Z0-9_]*)\}+/g) || []
  return fieldRefs.map(ref => ref.replace(/\{+|\}+/g, ''))
}

/**
 * Common formula templates
 */
export const FORMULA_TEMPLATES = {
  sum: '{field1} + {field2}',
  difference: '{field1} - {field2}',
  product: '{field1} * {field2}',
  quotient: '{field1} / {field2}',
  percentage: '({field1} / {field2}) * 100',
  average: '({field1} + {field2}) / 2',
  tax: '{subtotal} * {tax_rate} / 100',
  discount: '{price} * (1 - {discount_percent} / 100)',
  total: '{subtotal} + {tax} - {discount}'
}
