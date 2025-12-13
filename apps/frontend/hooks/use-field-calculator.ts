'use client'

import { useEffect, useState } from 'react'
import { useWatch, useFormContext } from 'react-hook-form'
import { calculateFormula, getFormulaFieldReferences } from '@/lib/conditional-logic/calculator'

export function useFieldCalculator(fieldId: string, formula: string) {
  const { setValue } = useFormContext()
  const [calculatedValue, setCalculatedValue] = useState<number | string | null>(null)

  // Get field references from formula
  const fieldRefs = getFormulaFieldReferences(formula)

  // Watch only the fields referenced in the formula
  const watchedValues = useWatch({ name: fieldRefs })

  useEffect(() => {
    // Create values object
    const values: Record<string, any> = {}
    fieldRefs.forEach((ref, index) => {
      values[ref] = watchedValues[index]
    })

    // Calculate new value
    const result = calculateFormula(formula, values)
    setCalculatedValue(result)

    // Update form value
    if (result !== null) {
      setValue(fieldId, result)
    }
  }, [watchedValues, formula, fieldId, setValue, fieldRefs])

  return calculatedValue
}
