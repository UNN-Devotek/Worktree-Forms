'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Condition, FormFieldBase } from '@/types/group-forms'
import { getOperatorsForFieldType } from '@/lib/conditional-logic/operators'

interface ConditionBuilderProps {
  condition: Condition
  availableFields: FormFieldBase[]
  onChange: (condition: Condition) => void
}

export function ConditionBuilder({
  condition,
  availableFields,
  onChange
}: ConditionBuilderProps) {
  const selectedField = availableFields.find(f => f.id === condition.fieldId)
  const operators = selectedField
    ? getOperatorsForFieldType(selectedField.type)
    : []

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
      <Label className="text-xs font-medium">When</Label>

      {/* Field Selection */}
      <Select
        value={condition.fieldId}
        onValueChange={(fieldId) =>
          onChange({ ...condition, fieldId })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a field" />
        </SelectTrigger>
        <SelectContent>
          {availableFields.map(field => (
            <SelectItem key={field.id} value={field.id}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Selection */}
      {selectedField && (
        <Select
          value={condition.operator}
          onValueChange={(operator) =>
            onChange({ ...condition, operator: operator as any })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map(op => (
              <SelectItem key={op} value={op}>
                {formatOperator(op)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Value Input */}
      {selectedField && !['is_empty', 'is_not_empty'].includes(condition.operator) && (
        <Input
          value={condition.value || ''}
          onChange={(e) =>
            onChange({ ...condition, value: e.target.value })
          }
          placeholder="Enter value"
        />
      )}
    </div>
  )
}

function formatOperator(operator: string): string {
  return operator
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
