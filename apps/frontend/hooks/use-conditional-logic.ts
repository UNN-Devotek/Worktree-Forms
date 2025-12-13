'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { ConditionalLogicEngine, LogicState } from '@/lib/conditional-logic/engine'
import { FormFieldBase } from '@/types/group-forms'

export function useConditionalLogic(fields: FormFieldBase[]) {
  const [logicState, setLogicState] = useState<LogicState>({
    visibleFields: new Set(fields.map(f => f.id)),
    enabledFields: new Set(fields.map(f => f.id)),
    calculatedValues: {}
  })

  // Create logic engine instance
  const engine = useMemo(() => new ConditionalLogicEngine(fields), [fields])

  // Watch all form values
  const formValues = useWatch()

  // Re-evaluate logic when form values change
  useEffect(() => {
    if (formValues) {
      const newState = engine.evaluate(formValues as Record<string, any>)
      setLogicState(newState)
    }
  }, [formValues, engine])

  return {
    isFieldVisible: (fieldId: string) => logicState.visibleFields.has(fieldId),
    isFieldEnabled: (fieldId: string) => logicState.enabledFields.has(fieldId),
    getCalculatedValue: (fieldId: string) => logicState.calculatedValues[fieldId],
    logicState
  }
}
