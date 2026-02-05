'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ValidationRuleCard } from '../editors/ValidationRuleCard'
import { Plus, Trash2 } from 'lucide-react'
import { FormFieldBase, ValidationRule } from '@/types/group-forms'
import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'

interface ValidationTabProps {
  field: FormFieldBase
}

export function ValidationTab({ field }: ValidationTabProps) {
  const { updateField } = useFormBuilderStore()
  const [validationRules, setValidationRules] = useState<ValidationRule[]>(
    Array.isArray(field.validation) ? field.validation : []
  )

  const addRule = () => {
    const newRule: ValidationRule = {
      type: 'min_length' as const,
      value: 1,
      message: ''
    }
    const updated = [...validationRules, newRule]
    setValidationRules(updated)
    updateField(field.id, { validation: updated })
  }

  const updateRule = (index: number, updates: Partial<ValidationRule>) => {
    const updated = [...validationRules]
    updated[index] = { ...updated[index], ...updates }
    setValidationRules(updated)
    updateField(field.id, { validation: updated })
  }

  const removeRule = (index: number) => {
    const updated = validationRules.filter((_, i) => i !== index)
    setValidationRules(updated)
    updateField(field.id, { validation: updated })
  }

  // Get available validation types based on field type
  const getAvailableValidationTypes = (): string[] => {
    switch (field.type) {
      case 'text':
      case 'textarea':
        return ['min_length', 'max_length', 'pattern', 'custom']

      case 'email':
        return ['email', 'min_length', 'max_length', 'custom']

      case 'phone':
        return ['phone', 'pattern', 'custom']

      case 'url':
        return ['url', 'custom']

      case 'number':
        return ['min_value', 'max_value', 'custom']

      case 'date':
        return ['date_range', 'custom']

      case 'file':
        return ['file_size', 'file_type', 'custom']

      default:
        return ['custom']
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Add validation rules to ensure data quality and accuracy.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Validation Rules</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRule}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {validationRules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No validation rules defined.
          Click &ldquo;Add Rule&rdquo; to create one.
        </p>
      ) : (
        <div className="space-y-4">
          {validationRules.map((rule, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Rule {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ValidationRuleCard
                  rule={rule}
                  availableTypes={getAvailableValidationTypes()}
                  onChange={(updates) => updateRule(index, updates)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
