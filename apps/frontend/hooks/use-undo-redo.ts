import { useEffect } from 'react'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'

/**
 * Custom hook for undo/redo functionality with keyboard shortcuts
 */
export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo } = useFormBuilderStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) {
          undo()
        }
      }

      // Ctrl+Y / Cmd+Shift+Z - Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault()
        if (canRedo()) {
          redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo])

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo()
  }
}
