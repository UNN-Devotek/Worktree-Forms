'use client'

import { useFieldCalculator } from '@/hooks/use-field-calculator'
import { FormFieldBase } from '@/types/group-forms'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CalculatedFieldProps {
  field: FormFieldBase
}

export function CalculatedField({ field }: CalculatedFieldProps) {
  const formula = Array.isArray(field.validation)
    ? ''
    : field.validation?.formula || ''
  const calculatedValue = useFieldCalculator(field.id, formula)

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        value={calculatedValue !== null ? String(calculatedValue) : ''}
        disabled
        readOnly
        className="bg-muted"
      />
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
    </div>
  )
}
