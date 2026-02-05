'use client'

import { Button } from '@/components/ui/button'
import { Undo2, Redo2 } from 'lucide-react'
import { useUndoRedo } from '@/hooks/use-undo-redo'

export function UndoRedo() {
  const { canUndo, canRedo, undo, redo } = useUndoRedo()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
