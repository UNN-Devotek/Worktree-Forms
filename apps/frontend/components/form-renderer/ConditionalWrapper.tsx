'use client'

import { ReactNode } from 'react'
import { useConditionalLogic } from '@/hooks/use-conditional-logic'
import { FormFieldBase } from '@/types/group-forms'

interface ConditionalWrapperProps {
  field: FormFieldBase
  allFields: FormFieldBase[]
  children: ReactNode
}

export function ConditionalWrapper({
  field,
  allFields,
  children
}: ConditionalWrapperProps) {
  const { isFieldVisible, isFieldEnabled } = useConditionalLogic(allFields)

  // Check if field should be visible
  if (!isFieldVisible(field.id)) {
    return null
  }

  // Wrap children with disabled state if needed
  if (!isFieldEnabled(field.id)) {
    return (
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    )
  }

  return <>{children}</>
}
