'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FormFieldBase } from '@/types/group-forms'
import { LogicAction } from '@/lib/conditional-logic/actions'

interface ActionSelectorProps {
  action: LogicAction
  targetFieldIds: string[]
  availableFields: FormFieldBase[]
  onChange: (action: LogicAction, targetFieldIds: string[]) => void
}

export function ActionSelector({
  action,
  targetFieldIds,
  availableFields,
  onChange
}: ActionSelectorProps) {
  const handleToggleField = (fieldId: string, checked: boolean) => {
    const updated = checked
      ? [...targetFieldIds, fieldId]
      : targetFieldIds.filter(id => id !== fieldId)
    onChange(action, updated)
  }

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
      <Label className="text-xs font-medium">Then</Label>

      {/* Action Type */}
      <Select
        value={action}
        onValueChange={(value) => onChange(value as LogicAction, targetFieldIds)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="show">Show</SelectItem>
          <SelectItem value="hide">Hide</SelectItem>
          <SelectItem value="enable">Enable</SelectItem>
          <SelectItem value="disable">Disable</SelectItem>
        </SelectContent>
      </Select>

      {/* Target Fields */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Target Fields</Label>
        {availableFields.map(field => (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={`target-${field.id}`}
              checked={targetFieldIds.includes(field.id)}
              onCheckedChange={(checked) =>
                handleToggleField(field.id, checked as boolean)
              }
            />
            <Label
              htmlFor={`target-${field.id}`}
              className="text-sm font-normal cursor-pointer"
            >
              {field.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
