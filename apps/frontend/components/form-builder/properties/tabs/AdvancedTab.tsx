'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'
import { FormFieldBase } from '@/types/group-forms'

interface AdvancedTabProps {
  field: FormFieldBase
}

export function AdvancedTab({ field }: AdvancedTabProps) {
  const { updateField } = useFormBuilderStore()

  const handleUpdate = (updates: Partial<typeof field>) => {
    updateField(field.id, updates)
  }

  return (
    <div className="space-y-6">
      {/* Field Name */}
      <div className="space-y-2">
        <Label htmlFor="field-name">Field Name (Key)</Label>
        <Input
          id="field-name"
          value={field.name || ''}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          placeholder="field_name"
        />
        <p className="text-xs text-muted-foreground">
          Used to identify this field in the response data. Must be unique.
        </p>
      </div>

      {/* ARIA Label */}
      <div className="space-y-2">
        <Label htmlFor="field-aria-label">ARIA Label (Accessibility)</Label>
        <Input
          id="field-aria-label"
          value={field.ariaLabel || ''}
          onChange={(e) => handleUpdate({ ariaLabel: e.target.value })}
          placeholder="Descriptive label for screen readers"
        />
        <p className="text-xs text-muted-foreground">
          Optional. Overrides the visible label for screen readers.
        </p>
      </div>

      {/* Default Value */}
      {!['file'].includes(field.type) && (
        <div className="space-y-2">
          <Label htmlFor="field-default">Default Value</Label>
          <Input
            id="field-default"
            value={field.defaultValue || ''}
            onChange={(e) => handleUpdate({ defaultValue: e.target.value })}
            placeholder="Default value"
          />
          <p className="text-xs text-muted-foreground">
            Pre-fill this field with a default value.
          </p>
        </div>
      )}
    </div>
  )
}
