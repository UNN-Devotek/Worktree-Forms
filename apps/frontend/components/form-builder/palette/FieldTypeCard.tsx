'use client'

import { useDraggable } from '@dnd-kit/core'
import { Card } from '@/components/ui/card'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldTypeCardProps {
  type: string
  label: string
  description: string
  icon: string
}

export function FieldTypeCard({ type, label, description, icon }: FieldTypeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging
  } = useDraggable({
    id: `palette-${type}`,
    data: { type, source: 'palette' }
  })

  // Dynamically get icon component
  const IconComponent = (Icons as any)[icon]

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-field-type={type}
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing',
        'hover:bg-accent transition-colors',
        'border border-border',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          {IconComponent && (
            <IconComponent className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium">{label}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
      </div>
    </Card>
  )
}
