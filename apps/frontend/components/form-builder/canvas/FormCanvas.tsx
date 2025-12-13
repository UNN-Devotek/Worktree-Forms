'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SectionContainer } from './SectionContainer'
import { EmptyState } from './EmptyState'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'
import { cn } from '@/lib/utils'

interface FormCanvasProps {
  isPreview?: boolean
  isSIGRequestForm?: boolean  // When true, default fields are locked
}

export function FormCanvas({ isPreview = false, isSIGRequestForm = false }: FormCanvasProps) {
  const {
    formSchema,
    currentPageIndex,
    previewMode,
    addSection
  } = useFormBuilderStore()

  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
    data: { type: 'canvas' }
  })

  const currentPage = formSchema?.pages[currentPageIndex]
  const sections = currentPage?.sections || []
  const sectionIds = sections.map(s => s.id)

  const getCanvasWidth = () => {
    switch (previewMode) {
      case 'tablet':
        return 'max-w-3xl'
      case 'mobile':
        return 'max-w-md'
      default:
        return 'max-w-5xl'
    }
  }

  if (sections.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          'mx-auto',
          getCanvasWidth()
        )}
      >
        <EmptyState />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mx-auto space-y-6',
        getCanvasWidth(),
        isOver && 'bg-accent/50 rounded-lg'
      )}
    >
      <SortableContext
        items={sectionIds}
        strategy={verticalListSortingStrategy}
      >
        {sections.map((section, index) => (
          <SectionContainer
            key={section.id}
            section={section}
            sectionIndex={index}
            pageIndex={currentPageIndex}
            isPreview={isPreview}
            isSIGRequestForm={isSIGRequestForm}
          />
        ))}
      </SortableContext>

      {/* Add Section Button (hidden in preview) */}
      {!isPreview && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => addSection(currentPageIndex)}
            data-action="add-section"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
      )}
    </div>
  )
}
