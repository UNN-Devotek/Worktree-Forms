import { useState } from 'react'
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'

/**
 * Custom hook for DND Kit drag-and-drop operations
 * Handles field and section dragging with proper collision detection
 */
export function useDragDrop() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const {
    addField,
    moveField,
    moveSection,
    addSection,
    addHalfWidthField,
    setFieldWidth,
    currentPageIndex,
    formSchema
  } = useFormBuilderStore()

  // Configure sensors for drag operations
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Require 8px movement before drag starts
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  /**
   * Handle drag start - store the active draggable ID
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  /**
   * Handle drag over - provide visual feedback
   */
  const handleDragOver = () => {
    // This is called continuously during drag
    // Can be used for real-time visual feedback
    // Currently handled by CSS and drop zones
  }

  /**
   * Handle drag end - perform the actual move or add operation
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // CASE 1: Dragging from palette to canvas
    if (activeData?.source === 'palette' && overData?.type === 'dropzone') {
      const fieldType = activeData.type
      const sectionIndex = overData.sectionIndex
      const fieldIndex = overData.fieldIndex

      addField(fieldType, sectionIndex, fieldIndex, currentPageIndex)
      return
    }

    // CASE 1.5: Dragging from palette to empty canvas (creates new section)
    if (activeData?.source === 'palette' && overData?.type === 'canvas') {
      const fieldType = activeData.type
      
      // Create new section
      addSection(currentPageIndex)
      
      // We need to wait for the section to be added before adding the field.
      // Since state updates are synchronous in Zustand but potential renders might not be, 
      // we can try to append to the last section of the current page.
      // However, knowing the exact index is better.


      // The new section will be at the end
 
      
      // Actually, since we just called addSection, it appended it.
      // But we can't easily get the new length immediately if we don't assume.
      // Let's assume it was added to the end.
      // Wait, we need to defer slightly or trust the store update order. 
      // Zustand updates are sync.
      
      // Let's rely on finding the last section index
      setTimeout(() => {
          const state = useFormBuilderStore.getState()
          const currentSections = state.formSchema?.pages[currentPageIndex]?.sections || []
          const lastSectionIndex = currentSections.length - 1
          if (lastSectionIndex >= 0) {
             addField(fieldType, lastSectionIndex, 0, currentPageIndex)
          }
      }, 0)
      
      return
    }

    // CASE 2: Reordering fields within or between sections
    if (activeData?.type === 'field' && overData?.type === 'dropzone') {
      const fromSection = activeData.sectionIndex
      const fromField = activeData.fieldIndex
      const toSection = overData.sectionIndex
      const toField = overData.fieldIndex

      // Don't move if it's the same position
      if (fromSection === toSection && fromField === toField) return

      moveField(fromSection, fromField, toSection, toField, currentPageIndex)
      return
    }

    // CASE 3: Reordering fields (sortable within section)
    if (activeData?.type === 'field' && overData?.type === 'field') {
      const fromSection = activeData.sectionIndex
      const fromField = activeData.fieldIndex
      const toSection = overData.sectionIndex
      const toField = overData.fieldIndex

      // Don't move if it's the same position
      if (fromSection === toSection && fromField === toField) return

      // Adjust target index if moving within same section
      let adjustedToField = toField
      if (fromSection === toSection && fromField < toField) {
        adjustedToField = toField - 1
      }

      moveField(fromSection, fromField, toSection, adjustedToField, currentPageIndex)
      return
    }

    // CASE 4: Reordering sections
    if (activeData?.type === 'section' && overData?.type === 'section') {
      const fromIndex = activeData.sectionIndex
      const toIndex = overData.sectionIndex

      if (fromIndex === toIndex) return

      moveSection(fromIndex, toIndex, currentPageIndex)
      return
    }

    // CASE 5: Dragging from palette to half-width drop zone (add as half-width field)
    if (activeData?.source === 'palette' && overData?.type === 'half-width-dropzone') {
      const fieldType = activeData.type
      const sectionIndex = overData.sectionIndex
      const pageIndex = overData.pageIndex ?? currentPageIndex
      let columnIndex: 0 | 1 = overData.columnIndex === 1 ? 1 : 0

      // Enforce "must pair" rule - if dropping to right with no left field, snap to left
      if (columnIndex === 1 && formSchema) {
        const section = formSchema.pages[pageIndex]?.sections[sectionIndex]
        const hasLeftField = section?.fields?.some(
          (f) => f.colSpan === 6 && f.columnIndex === 0
        )
        if (!hasLeftField) {
          columnIndex = 0
        }
      }

      addHalfWidthField(fieldType, sectionIndex, columnIndex, pageIndex)
      return
    }

    // CASE 6: Moving existing field to half-width drop zone (change to half-width)
    if (activeData?.type === 'field' && overData?.type === 'half-width-dropzone') {
      const fromSection = activeData.sectionIndex
      const fromFieldIndex = activeData.fieldIndex
      const toSection = overData.sectionIndex
      const pageIndex = overData.pageIndex ?? currentPageIndex
      let columnIndex: 0 | 1 = overData.columnIndex === 1 ? 1 : 0

      // Enforce "must pair" rule
      if (columnIndex === 1 && formSchema) {
        const section = formSchema.pages[pageIndex]?.sections[toSection]
        const hasLeftField = section?.fields?.some(
          (f) => f.colSpan === 6 && f.columnIndex === 0
        )
        if (!hasLeftField) {
          columnIndex = 0
        }
      }

      // If same section, just update the field's width and column
      if (fromSection === toSection) {
        setFieldWidth(fromSection, fromFieldIndex, 6, columnIndex, pageIndex)
      } else {
        // Move to different section as half-width
        moveField(fromSection, fromFieldIndex, toSection, 0, pageIndex)
        // Then set the field width (need to find the field in the new position)
        // For simplicity, we'll set width on the last field in the section
        const newFieldIndex = formSchema?.pages[pageIndex]?.sections[toSection]?.fields?.length || 0
        setFieldWidth(toSection, newFieldIndex - 1, 6, columnIndex, pageIndex)
      }
      return
    }

    // CASE 7: Legacy - Dragging from palette to horizontal drop zone
    if (activeData?.source === 'palette' && overData?.type === 'horizontal-dropzone') {
      const fieldType = activeData.type
      const sectionIndex = overData.sectionIndex
      let columnIndex: 0 | 1 = overData.side === 'left' ? 0 : 1

      // Enforce "must pair" rule
      if (columnIndex === 1 && formSchema) {
        const section = formSchema.pages[currentPageIndex]?.sections[sectionIndex]
        const hasLeftField = section?.fields?.some(
          (f) => f.colSpan === 6 && f.columnIndex === 0
        )
        if (!hasLeftField) {
          columnIndex = 0
        }
      }

      addHalfWidthField(fieldType, sectionIndex, columnIndex, currentPageIndex)
      return
    }

    // CASE 8: Legacy - Moving field to horizontal drop zone
    if (activeData?.type === 'field' && overData?.type === 'horizontal-dropzone') {
      const fromSection = activeData.sectionIndex
      const fromFieldIndex = activeData.fieldIndex
      const toSection = overData.sectionIndex
      let columnIndex: 0 | 1 = overData.side === 'left' ? 0 : 1

      // Enforce "must pair" rule
      if (columnIndex === 1 && formSchema) {
        const section = formSchema.pages[currentPageIndex]?.sections[toSection]
        const hasLeftField = section?.fields?.some(
          (f) => f.colSpan === 6 && f.columnIndex === 0
        )
        if (!hasLeftField) {
          columnIndex = 0
        }
      }

      setFieldWidth(fromSection, fromFieldIndex, 6, columnIndex, currentPageIndex)
      return
    }

    // CASE 9: Fallback - dropping from palette directly onto a section
    // This happens when the section's droppable catches the drop instead of the DropZone
    if (activeData?.source === 'palette' && overData?.type === 'section') {
      const fieldType = activeData.type
      const sectionIndex = overData.sectionIndex

      // Add field to first column at the end (append to section)
      addField(fieldType, sectionIndex, 0, currentPageIndex)
      return
    }

    // CASE 10: Fallback - moving field onto a section
    // This happens when dragging a field and landing on the section container
    if (activeData?.type === 'field' && overData?.type === 'section') {
      const fromSection = activeData.sectionIndex
      const fromField = activeData.fieldIndex
      const toSection = overData.sectionIndex

      // Don't move if it's the same section (would need a specific position)
      if (fromSection === toSection) return

      // Move to end of target section
      moveField(fromSection, fromField, toSection, 0, currentPageIndex)
      return
    }
  }

  return {
    sensors,
    activeId,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  }
}