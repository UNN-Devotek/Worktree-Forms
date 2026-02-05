'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { FormFieldBase } from '@/types/group-forms'
import { GripHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DraggablePdfFieldProps {
    field: FormFieldBase
}

export function DraggablePdfField({ field }: DraggablePdfFieldProps) {
    // We use the field ID as the draggable ID
    // We need to attach data so the dragEnd handler knows it's an existing field being moved
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: field.id,
        data: {
            type: 'field',
            fieldId: field.id,
            // We include existing position to calculate delta
            currentX: field.overlay?.x || 0,
            currentY: field.overlay?.y || 0
        }
    })

    // Position logic:
    // If we are dragging, dnd-kit provides `transform` (delta).
    // We apply it via CSS transform to show movement.
    // The base position is `top/left` from field.overlay.
    
    // Default to 0,0 if not set (user will drag it to place)
    const x = field.overlay?.x || 0
    const y = field.overlay?.y || 0
    
    // During drag, we translate. 
    // Note: dnd-kit transform is {x, y} delta.
    const style: React.CSSProperties = {
        left: x,
        top: y,
        position: 'absolute',
        width: '200px', // Standard width for overlay fields
        zIndex: isDragging ? 50 : 20,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    }

    return (
        <div 
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "bg-white/95 border shadow-sm rounded p-2 text-xs flex items-center gap-2 cursor-move select-none",
                "hover:ring-1 hover:ring-primary",
                 isDragging && "opacity-80 ring-2 ring-primary"
            )}
        >
            <GripHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{field.label || field.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{field.type}</div>
            </div>
        </div>
    )
}
