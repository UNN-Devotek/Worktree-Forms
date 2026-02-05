'use client'

import { useDroppable } from '@dnd-kit/core'
import { useDndContext } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropZoneProps {
  sectionIndex: number
  fieldIndex: number
  columnIndex?: number  // Optional column index for column-based layout
  isEmpty?: boolean
}

export function DropZone({ sectionIndex, fieldIndex, columnIndex, isEmpty = false }: DropZoneProps) {
  // Include columnIndex in ID if provided
  const dropzoneId = columnIndex !== undefined
    ? `dropzone-${sectionIndex}-col-${columnIndex}-${fieldIndex}`
    : `dropzone-${sectionIndex}-${fieldIndex}`

  const { setNodeRef, isOver } = useDroppable({
    id: dropzoneId,
    data: { type: 'dropzone', sectionIndex, fieldIndex, columnIndex }
  })

  const { active } = useDndContext()
  const isDragging = active !== null

  // Empty section state - always show drop area
  if (isEmpty) {
    return (
      <div
        ref={setNodeRef}
        data-drop-zone="indicator"
        data-section={sectionIndex}
        data-field-index={fieldIndex}
        className={cn(
          'min-h-[100px] border-2 border-dashed rounded-lg transition-all flex items-center justify-center',
          isOver ? 'bg-primary/20 border-primary' : 'border-muted-foreground/30',
          isDragging && !isOver && 'bg-accent/50 border-primary/50'
        )}
      >
        <div className="text-center text-muted-foreground">
          <Plus className="h-6 w-6 mx-auto mb-1 opacity-50" />
          <p className="text-sm">{isDragging ? 'Drop field here' : 'Drag a field here'}</p>
        </div>
      </div>
    )
  }

  // Normal drop zone between fields
  return (
    <div
      ref={setNodeRef}
      data-drop-zone="indicator"
      data-section={sectionIndex}
      data-field-index={fieldIndex}
      className={cn(
        'transition-all',
        // Default state - thin line
        !isDragging && 'h-1',
        // When dragging but not over - show hint
        isDragging && !isOver && 'h-2 bg-accent/30 rounded',
        // When dragging over - expand and highlight
        isOver && 'h-12 bg-primary/20 border-2 border-dashed border-primary rounded-lg flex items-center justify-center'
      )}
    >
      {isOver && (
        <span className="text-xs text-primary font-medium">Drop here</span>
      )}
    </div>
  )
}
