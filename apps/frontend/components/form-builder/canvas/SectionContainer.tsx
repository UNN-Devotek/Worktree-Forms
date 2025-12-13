'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldContainer } from './FieldContainer'
import { groupFieldsForSegmentedLayout } from './ColumnContainer'
import { DropZone } from './DropZone'
import { FullWidthDropZone, HalfWidthDropZone } from './HorizontalDropZone'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormSection } from '@/types/group-forms'

interface SectionContainerProps {
  section: FormSection
  sectionIndex: number
  pageIndex?: number
  isPreview?: boolean
  isSIGRequestForm?: boolean  // When true, default fields are locked
}

export function SectionContainer({ section, sectionIndex, pageIndex = 0, isPreview = false, isSIGRequestForm = false }: SectionContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const {
    updateSection,
    removeSection
  } = useFormBuilderStore()

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: section.id,
    data: { type: 'section', sectionIndex }
  })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: { type: 'section', sectionIndex }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const fields = section.fields || []
  const { segments, hasHalfWidthFields } = groupFieldsForSegmentedLayout(fields)

  return (
    <Card
      ref={setSortableRef}
      style={style}
      data-section={sectionIndex}
      className={cn(
        'transition-all',
        isDragging && 'opacity-50',
        isOver && 'ring-2 ring-primary'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {/* Drag Handle - hidden in preview */}
          {!isPreview && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
              aria-label="Drag section"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          )}

          {/* Section Title */}
          {!isPreview && isEditingTitle ? (
            <Input
              value={section.title || ''}
              onChange={(e) => updateSection(sectionIndex, { title: e.target.value }, pageIndex)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false)
              }}
              autoFocus
              className="flex-1"
            />
          ) : (
            <h3
              className={cn(
                "flex-1 font-semibold",
                !isPreview && "cursor-pointer hover:text-primary"
              )}
              onClick={() => !isPreview && setIsEditingTitle(true)}
            >
              {section.title || 'Untitled Section'}
            </h3>
          )}

          {/* Section Actions - hidden in preview */}
          {!isPreview && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSection(sectionIndex, pageIndex)}
                aria-label="Delete section"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent ref={!isPreview ? setDroppableRef : undefined}>
          {fields.length === 0 ? (
            isPreview ? (
              <p className="text-sm text-muted-foreground text-center py-4">No fields in this section</p>
            ) : (
              /* Empty section - only show full-width drop zone so fields default to full width */
              <DropZone sectionIndex={sectionIndex} fieldIndex={0} columnIndex={0} isEmpty />
            )
          ) : (
            <div className="space-y-2">
              {/* Render segments in order - preserves field ordering */}
              {segments.map((segment, segmentIndex) => {
                if (segment.type === 'full-width') {
                  // Full-width field segment
                  return (
                    <div key={segment.field.id} className="w-full">
                      {!isPreview && (
                        <DropZone
                          sectionIndex={sectionIndex}
                          fieldIndex={segment.field._fieldIndex}
                          columnIndex={0}
                        />
                      )}
                      <FieldContainer
                        field={segment.field}
                        sectionIndex={sectionIndex}
                        fieldIndex={segment.field._fieldIndex}
                        pageIndex={pageIndex}
                        isPreview={isPreview}
                        isSIGRequestForm={isSIGRequestForm}
                      />
                    </div>
                  )
                } else {
                  // Masonry segment - render left and right columns
                  return (
                    <div key={`masonry-${segmentIndex}`} className="flex gap-4 items-start">
                      {/* Left column - independent vertical stack */}
                      <div className="w-full sm:w-1/2 space-y-2">
                        {segment.leftFields.map((field) => (
                          <div key={field.id}>
                            {!isPreview && (
                              <DropZone
                                sectionIndex={sectionIndex}
                                fieldIndex={field._fieldIndex}
                                columnIndex={0}
                              />
                            )}
                            <FieldContainer
                              field={field}
                              sectionIndex={sectionIndex}
                              fieldIndex={field._fieldIndex}
                              columnIndex={0}
                              pageIndex={pageIndex}
                              isPreview={isPreview}
                              isSIGRequestForm={isSIGRequestForm}
                            />
                          </div>
                        ))}
                        {/* Drop zone at bottom of left column */}
                        {!isPreview && (
                          <HalfWidthDropZone sectionIndex={sectionIndex} side="left" pageIndex={pageIndex} />
                        )}
                      </div>

                      {/* Right column - independent vertical stack */}
                      <div className="w-full sm:w-1/2 space-y-2">
                        {segment.rightFields.map((field) => (
                          <div key={field.id}>
                            {!isPreview && (
                              <DropZone
                                sectionIndex={sectionIndex}
                                fieldIndex={field._fieldIndex}
                                columnIndex={1}
                              />
                            )}
                            <FieldContainer
                              field={field}
                              sectionIndex={sectionIndex}
                              fieldIndex={field._fieldIndex}
                              columnIndex={1}
                              pageIndex={pageIndex}
                              isPreview={isPreview}
                              isSIGRequestForm={isSIGRequestForm}
                            />
                          </div>
                        ))}
                        {/* Drop zone at bottom of right column */}
                        {!isPreview && (
                          <HalfWidthDropZone sectionIndex={sectionIndex} side="right" pageIndex={pageIndex} />
                        )}
                      </div>
                    </div>
                  )
                }
              })}

              {/* Final drop zone for adding more fields */}
              {!isPreview && (
                <div className="space-y-2 mt-4">
                  <FullWidthDropZone
                    sectionIndex={sectionIndex}
                    fieldIndex={fields.length}
                    pageIndex={pageIndex}
                  />
                  {/* Show half-width options if no half-width fields exist yet */}
                  {!hasHalfWidthFields && (
                    <div className="flex gap-4">
                      <HalfWidthDropZone sectionIndex={sectionIndex} side="left" pageIndex={pageIndex} />
                      <HalfWidthDropZone sectionIndex={sectionIndex} side="right" pageIndex={pageIndex} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}