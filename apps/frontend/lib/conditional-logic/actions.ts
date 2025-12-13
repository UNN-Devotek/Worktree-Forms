import { LogicState } from './engine'
import { ConditionalAction } from '@/types/group-forms'

export type LogicAction = ConditionalAction

/**
 * Execute a logic action
 */
export function executeAction(
  action: LogicAction,
  targetFieldIds: string[],
  state: LogicState
) {
  targetFieldIds.forEach(targetId => {
    switch (action) {
      case 'show':
        state.visibleFields.add(targetId)
        break

      case 'hide':
        state.visibleFields.delete(targetId)
        break

      case 'enable':
        state.enabledFields.add(targetId)
        break

      case 'disable':
        state.enabledFields.delete(targetId)
        break

      case 'set_value':
        // This would require additional value parameter
        // Implementation depends on use case
        break
    }
  })
}