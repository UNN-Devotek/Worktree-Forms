'use client'

import { useDroppable, useDndContext } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

/**
 * Full-width drop zone for adding fields at 100% width.
 * Shows during drag operations with prominent styling.
 */
interface FullWidthDropZoneProps {
  sectionIndex: number
  fieldIndex: number
  pageIndex?: number
}

export function FullWidthDropZone({ sectionIndex, fieldIndex, pageIndex = 0 }: FullWidthDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-${sectionIndex}-full-width`,
    data: {
      type: 'dropzone',
      sectionIndex,
      fieldIndex,
      pageIndex,
      columnIndex: 0
    }
  })

  const { active } = useDndContext()
  const isDragging = active !== null

  // Only show during drag operations
  if (!isDragging) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      data-full-width-dropzone
      data-section={sectionIndex}
      className={cn(
        'w-full min-h-[60px] border-2 border-dashed rounded-lg transition-all duration-200',
        'flex items-center justify-center',
        isOver
          ? 'bg-primary/20 border-primary'
          : 'bg-muted/30 border-muted-foreground/30'
      )}
    >
      <span className={cn(
        'text-sm font-medium',
        isOver ? 'text-primary' : 'text-muted-foreground'
      )}>
        Full Width
      </span>
    </div>
  )
}

/**
 * Simplified drop zone for adding half-width fields.
 * Shows as a left/right drop indicator at the bottom of sections.
 */
interface HalfWidthDropZoneProps {
  sectionIndex: number
  side: 'left' | 'right'
  pageIndex?: number
}

export function HalfWidthDropZone({ sectionIndex, side, pageIndex = 0 }: HalfWidthDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-${sectionIndex}-half-${side}`,
    data: {
      type: 'half-width-dropzone',
      sectionIndex,
      pageIndex,
      columnIndex: side === 'left' ? 0 : 1,
      side
    }
  })

  const { active } = useDndContext()
  const isDragging = active !== null

  // Only show during drag operations
  if (!isDragging) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      data-half-width-dropzone={side}
      data-section={sectionIndex}
      className={cn(
        'flex-1 min-h-[60px] border-2 border-dashed rounded-lg transition-all duration-200',
        'flex items-center justify-center',
        isOver
          ? 'bg-primary/20 border-primary'
          : 'bg-muted/30 border-muted-foreground/30'
      )}
    >
      <span className={cn(
        'text-sm font-medium',
        isOver ? 'text-primary' : 'text-muted-foreground'
      )}>
        {side === 'left' ? 'Left Column' : 'Right Column'}
      </span>
    </div>
  )
}

// ==========================================
// Legacy components (kept for compatibility)
// ==========================================

interface HorizontalDropZoneProps {
  sectionIndex: number
  columnIndex: number
  side: 'left' | 'right'
  isFirstColumn?: boolean
  isLastColumn?: boolean
}

/**
 * Horizontal drop zone for creating new columns.
 * Appears as a vertical bar on the left/right edge of columns.
 */
export function HorizontalDropZone({
  sectionIndex,
  columnIndex,
  side,
  isFirstColumn = false,
}: HorizontalDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-${sectionIndex}-column-${columnIndex}-${side}`,
    data: {
      type: 'horizontal-dropzone',
      sectionIndex,
      columnIndex,
      side
    }
  })

  const { active } = useDndContext()
  const isDragging = active !== null

  // Only show during drag operations
  if (!isDragging) {
    return null
  }

  // Don't show left zone on first column or right zone on last column
  // since those are handled by the section-level drop zones
  if (side === 'left' && isFirstColumn) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      data-horizontal-dropzone={side}
      data-section={sectionIndex}
      data-column={columnIndex}
      className={cn(
        'absolute top-0 bottom-0 w-4 z-20 transition-all duration-200',
        side === 'left' && '-left-2',
        side === 'right' && '-right-2',
        // Base state during drag
        'bg-primary/10 border-2 border-dashed border-transparent',
        // Hover/active state
        isOver && 'w-8 bg-primary/30 border-primary',
        // Visual indicator
        isOver && side === 'left' && '-left-4',
        isOver && side === 'right' && '-right-4'
      )}
    >
      {isOver && (
        <div className={cn(
          'absolute top-1/2 -translate-y-1/2 text-xs font-medium text-primary whitespace-nowrap',
          side === 'left' && 'left-1/2 -translate-x-1/2 rotate-90',
          side === 'right' && 'left-1/2 -translate-x-1/2 rotate-90'
        )}>
          New Column
        </div>
      )}
    </div>
  )
}

/**
 * Drop zone for creating the first column in a section or adding columns at edges.
 */
interface NewColumnDropZoneProps {
  sectionIndex: number
  position: 'start' | 'end'
  columnCount: number
}

export function NewColumnDropZone({ sectionIndex, position, columnCount }: NewColumnDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-${sectionIndex}-new-column-${position}`,
    data: {
      type: 'horizontal-dropzone',
      sectionIndex,
      columnIndex: position === 'start' ? 0 : columnCount,
      side: position === 'start' ? 'left' : 'right',
      isNewColumn: true
    }
  })

  const { active } = useDndContext()
  const isDragging = active !== null

  if (!isDragging) {
    return null
  }

  // Max 4 columns
  if (columnCount >= 4) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      data-new-column-dropzone={position}
      data-section={sectionIndex}
      className={cn(
        'flex-shrink-0 w-4 min-h-[100px] transition-all duration-200 rounded',
        'bg-primary/10 border-2 border-dashed border-primary/30',
        isOver && 'w-16 bg-primary/30 border-primary'
      )}
    >
      {isOver && (
        <div className="h-full flex items-center justify-center">
          <span className="text-xs font-medium text-primary rotate-90 whitespace-nowrap">
            New Column
          </span>
        </div>
      )}
    </div>
  )
}