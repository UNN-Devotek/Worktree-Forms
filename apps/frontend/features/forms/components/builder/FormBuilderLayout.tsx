'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { FormCanvas } from './canvas/FormCanvas'
import { QuestionPalette } from './palette/QuestionPalette'
import { PropertiesPanel } from './properties/PropertiesPanel'
import { BuilderToolbar } from './toolbar/BuilderToolbar'
import { FormSettingsModal } from './settings/FormSettingsModal'
import { PreviewModal } from './PreviewModal'
import { PageTabs } from './pages/PageTabs'

import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'
import { useDragDrop } from '@/hooks/use-drag-drop'
import { useAutoSave } from '@/hooks/use-auto-save'
import { FormSchema, FormType } from '@/types/group-forms'
import { cn } from '@/lib/utils'

interface FormBuilderLayoutProps {
  formId?: number
  groupId: number
  groupSlug?: string        // URL-friendly group identifier
  formSlug?: string         // URL-friendly form identifier
  groupName?: string
  formTitle?: string
  formType?: FormType
  initialSchema?: FormSchema
  isNewForm?: boolean
  isSIGRequestForm?: boolean  // When true, default fields are locked and cannot be edited
}

export function FormBuilderLayout({ formId, groupId, groupSlug, formSlug, groupName, formTitle, formType = 'general', initialSchema, isNewForm = false, isSIGRequestForm = false }: FormBuilderLayoutProps) {
  const searchParams = useSearchParams()
  const {
    formSchema,
    selectedFieldId,
    previewMode,
    isDirty,
    initializeForm
  } = useFormBuilderStore()

  const {
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    activeId
  } = useDragDrop()

  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false)
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)


  // Determine if this is a new form (only check once on mount)
  const isNew = searchParams.get('new') === 'true' || isNewForm
  const [isSettingsOpen, setIsSettingsOpen] = useState(isNew)

  // Initialize form on mount
  useEffect(() => {
    initializeForm(initialSchema)
  }, [initializeForm, initialSchema])

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Auto-save to localStorage (3s debounce)
  useAutoSave({
    formId,
    formSchema,
    isDirty,
    debounceMs: 3000,
  })

  if (!formSchema) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="text-muted-foreground">Loading form builder...</p>
        </div>
      </div>
    )
  }



  return (
    <div className="h-screen flex flex-col bg-background border rounded-tl-lg overflow-hidden">
      {/* Top Toolbar */}
      <BuilderToolbar
        formId={formId}
        groupId={groupId}
        groupSlug={groupSlug}
        formSlug={formSlug}
        groupName={groupName}
        formTitle={formTitle}
        formType={formType}
        onTogglePalette={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
        onToggleProperties={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPreview={() => setIsPreviewOpen(true)}

      />

      {/* Form Settings Modal */}
      <FormSettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        groupId={groupId}
        groupSlug={groupSlug}
        formId={formId}
      />

      {/* Preview Modal */}
      <PreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Main Content Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Question Palette */}
          {!isPaletteCollapsed && (
            <aside
              className={cn(
                'w-64 border-r bg-card overflow-y-auto overflow-x-hidden',
                'transition-all duration-300'
              )}
              data-testid="question-palette"
              aria-label="Field types palette"
            >
              <QuestionPalette />
            </aside>
          )}

          {/* Center - Form Canvas */}
          <main
            className="flex-1 flex flex-col overflow-hidden"
            data-testid="form-canvas"
            aria-label="Form canvas"
          >
            {/* Page Tabs */}
            <PageTabs />

            {/* Canvas Area */}
            <div
              className={cn(
                'flex-1 overflow-auto pt-4 pl-4 pr-6 pb-6 max-w-none w-full relative', // Added relative for overlay context
                previewMode !== 'desktop' && 'flex items-start justify-center'
              )}
            >
              <FormCanvas isSIGRequestForm={isSIGRequestForm} />
            </div>
          </main>

          {/* Right Sidebar - Properties Panel */}
          {!isPropertiesCollapsed && selectedFieldId && (
            <aside
              className={cn(
                'w-80 border-l bg-card overflow-y-auto',
                'transition-all duration-300'
              )}
              data-testid="properties-panel"
              aria-label="Field properties"
            >
              <PropertiesPanel groupId={groupId} formId={formId} isSIGRequestForm={isSIGRequestForm} />
            </aside>
          )}
        </div>

        {/* Drag Overlay - Shows dragging field */}
        <DragOverlay>
          {activeId ? (
            <div
              className="bg-card border rounded-lg p-4 shadow-lg opacity-80"
              data-drag-ghost
            >
              Dragging field...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
