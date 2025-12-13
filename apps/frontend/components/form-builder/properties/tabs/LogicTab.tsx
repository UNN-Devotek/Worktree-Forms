'use client'

import { ConditionalEditor } from '../editors/ConditionalEditor'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'
import { FormFieldBase } from '@/types/group-forms'

interface LogicTabProps {
  field: FormFieldBase
}

export function LogicTab({ field }: LogicTabProps) {
  const { formSchema, updateField } = useFormBuilderStore()

  // Get all fields from all sections
  const allFields = formSchema?.pages[0]?.sections.flatMap(s => s.fields) || []

  const handleLogicChange = (logic: any[]) => {
    updateField(field.id, { conditionalLogic: logic })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Define rules to show/hide or enable/disable fields based on other field values.
        </p>
      </div>

      <ConditionalEditor
        field={field}
        allFields={allFields}
        logic={field.conditionalLogic || []}
        onChange={handleLogicChange}
      />
    </div>
  )
}
