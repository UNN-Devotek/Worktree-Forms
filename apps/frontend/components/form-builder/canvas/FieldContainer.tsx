'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'
import { getFieldComponent } from '@/lib/field-registry'
import { GripVertical, Copy, Trash2, Settings, Lock } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { FormFieldBase } from '@/types/group-forms'

interface FieldContainerProps {
  field: FormFieldBase
  sectionIndex: number
  fieldIndex: number
  columnIndex?: number  // Optional column index for column-based layout
  pageIndex?: number
  isPreview?: boolean
  isSIGRequestForm?: boolean  // When true, default fields are locked
}

export function FieldContainer({ field, sectionIndex, fieldIndex, columnIndex, pageIndex = 0, isPreview = false, isSIGRequestForm = false }: FieldContainerProps) {
  const {
    selectedFieldId,
    selectField,
    removeField,
    duplicateField
  } = useFormBuilderStore()

  // Determine if this field is locked (only in SIG request forms)
  const isLockedField = isSIGRequestForm && field.isDefaultField === true

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: field.id,
    data: { type: 'field', sectionIndex, fieldIndex, columnIndex, field }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const FieldComponent = getFieldComponent(field.type)
  const isSelected = selectedFieldId === field.id

  // In preview mode, render a simpler version without editing controls
  if (isPreview) {
    return (
      <div className="p-4">
        {FieldComponent && (
          <FieldComponent field={field} mode="preview" />
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Card
        ref={setNodeRef}
        style={style}
        data-field-id={field.id}
        onClick={() => !isLockedField && selectField(field.id)}
        className={cn(
          'relative group transition-all',
          !isLockedField && 'cursor-pointer',
          isDragging && 'opacity-50 drag-active',
          isSelected && !isLockedField && 'ring-2 ring-primary',
          isLockedField && 'border-muted bg-muted/20'
        )}
      >
        {/* Drag Handle Overlay - hidden for locked fields */}
        {!isLockedField && (
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'bg-gradient-to-r from-accent to-transparent',
              'rounded-l-xl'
            )}
          >
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
              aria-label="Drag field"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Lock Icon for locked fields */}
        {isLockedField && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center',
                  'bg-gradient-to-r from-muted to-transparent',
                  'rounded-l-xl'
                )}
              >
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>This is a required field and cannot be modified</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Field Content */}
        <div className="p-4 pl-12">
          {FieldComponent && (
            <FieldComponent field={field} mode="builder" />
          )}
        </div>

        {/* Action Buttons - hidden for locked fields */}
        {!isLockedField && (
          <div
            className={cn(
              'absolute top-2 right-2 flex gap-1',
              'opacity-0 group-hover:opacity-100 transition-opacity'
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                duplicateField(sectionIndex, fieldIndex, pageIndex)
              }}
              aria-label="Duplicate field"
            >
              <Copy className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                selectField(field.id)
              }}
              aria-label="Field settings"
            >
              <Settings className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                removeField(sectionIndex, fieldIndex, pageIndex)
              }}
              aria-label="Delete field"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        )}
      </Card>
    </TooltipProvider>
  )
}
