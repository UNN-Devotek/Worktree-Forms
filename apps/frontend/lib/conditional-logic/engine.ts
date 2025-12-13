import { FormFieldBase, ConditionalLogic } from '@/types/group-forms'
import { evaluateCondition } from './evaluator'
import { executeAction } from './actions'

export interface LogicState {
  visibleFields: Set<string>
  enabledFields: Set<string>
  calculatedValues: Record<string, any>
}

export class ConditionalLogicEngine {
  private state: LogicState = {
    visibleFields: new Set(),
    enabledFields: new Set(),
    calculatedValues: {}
  }

  constructor(private fields: FormFieldBase[]) {
    // Initialize all fields as visible and enabled by default
    fields.forEach(field => {
      this.state.visibleFields.add(field.id)
      this.state.enabledFields.add(field.id)
    })
  }

  /**
   * Evaluate all conditional logic rules
   */
  evaluate(formValues: Record<string, any>): LogicState {
    // Reset state
    this.resetState()

    // Process each field's conditional logic
    this.fields.forEach(field => {
      if (field.conditionalLogic && field.conditionalLogic.length > 0) {
        this.processFieldLogic(field, formValues)
      }
    })

    return this.state
  }

  /**
   * Process conditional logic for a single field
   */
  private processFieldLogic(field: FormFieldBase, formValues: Record<string, any>) {
    field.conditionalLogic?.forEach(logic => {
      // Evaluate the condition
      const conditionMet = this.evaluateLogic(logic, formValues)

      // Execute the action if condition is met
      if (conditionMet) {
        executeAction(logic.action, logic.targetFieldIds || [], this.state)
      }
    })
  }

  /**
   * Evaluate a logic rule (handles AND/OR groups)
   */
  private evaluateLogic(logic: ConditionalLogic, formValues: Record<string, any>): boolean {
    if (logic.condition && 'condition' in logic) {
      // Single condition
      const sourceField = this.fields.find(f => f.id === logic.condition!.fieldId)
      if (!sourceField) return false

      return evaluateCondition(
        logic.condition,
        formValues[sourceField.name],
        sourceField
      )
    } else if (logic.conditions && 'conditions' in logic) {
      // Multiple conditions with AND/OR
      const results = logic.conditions.map(cond => {
        const sourceField = this.fields.find(f => f.id === cond.fieldId)
        if (!sourceField) return false

        return evaluateCondition(
          cond,
          formValues[sourceField.name],
          sourceField
        )
      })

      // Apply AND/OR logic
      return logic.logicOperator === 'and'
        ? results.every(r => r)
        : results.some(r => r)
    }

    return false
  }

  /**
   * Check if field should be visible
   */
  isFieldVisible(fieldId: string): boolean {
    return this.state.visibleFields.has(fieldId)
  }

  /**
   * Check if field should be enabled
   */
  isFieldEnabled(fieldId: string): boolean {
    return this.state.enabledFields.has(fieldId)
  }

  /**
   * Get calculated value for field
   */
  getCalculatedValue(fieldId: string): any {
    return this.state.calculatedValues[fieldId]
  }

  /**
   * Reset state to defaults
   */
  private resetState() {
    this.state.visibleFields = new Set(this.fields.map(f => f.id))
    this.state.enabledFields = new Set(this.fields.map(f => f.id))
    this.state.calculatedValues = {}
  }

  /**
   * Get current state
   */
  getState(): LogicState {
    return this.state
  }
}