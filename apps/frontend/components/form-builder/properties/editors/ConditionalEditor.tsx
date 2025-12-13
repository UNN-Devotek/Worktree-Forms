'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConditionBuilder } from './ConditionBuilder'
import { ActionSelector } from './ActionSelector'
import { Plus, Trash2 } from 'lucide-react'
import { ConditionalLogic, FormFieldBase } from '@/types/group-forms'

interface ConditionalEditorProps {
  field: FormFieldBase
  allFields: FormFieldBase[]
  logic: ConditionalLogic[]
  onChange: (logic: ConditionalLogic[]) => void
}

export function ConditionalEditor({
  field,
  allFields,
  logic,
  onChange
}: ConditionalEditorProps) {
  const addRule = () => {
    const newRule: ConditionalLogic = {
      id: `rule_${Date.now()}`,
      condition: {
        fieldId: '',
        operator: 'equals',
        value: ''
      },
      action: 'show',
      targetFieldIds: []
    }
    onChange([...logic, newRule])
  }

  const updateRule = (index: number, updates: Partial<ConditionalLogic>) => {
    const updated = [...logic]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeRule = (index: number) => {
    onChange(logic.filter((_, i) => i !== index))
  }

  // Filter out current field from available fields
  const availableFields = allFields.filter(f => f.id !== field.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Conditional Logic Rules</h4>
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

      {logic.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No conditional logic rules defined.
          Click &quot;Add Rule&quot; to create one.
        </p>
      ) : (
        <div className="space-y-4">
          {logic.map((rule, index) => (
            <Card key={rule.id}>
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
              <CardContent className="space-y-4">
                {/* Condition Builder */}
                <ConditionBuilder
                  condition={
                    rule.condition ||
                    (rule.conditions && rule.conditions.length > 0 ? rule.conditions[0] : {
                      fieldId: '',
                      operator: 'equals',
                      value: ''
                    })
                  }
                  availableFields={availableFields}
                  onChange={(condition) =>
                    updateRule(index, { condition })
                  }
                />

                {/* Action Selector */}
                <ActionSelector
                  action={rule.action}
                  targetFieldIds={rule.targetFieldIds || []}
                  availableFields={availableFields}
                  onChange={(action, targetFieldIds) =>
                    updateRule(index, { action, targetFieldIds })
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
