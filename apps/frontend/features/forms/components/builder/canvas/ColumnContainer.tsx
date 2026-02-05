'use client'

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { FieldContainer } from './FieldContainer'
import { DropZone } from './DropZone'
import { HorizontalDropZone } from './HorizontalDropZone'
import { cn } from '@/lib/utils'
import { FormFieldBase } from '@/types/group-forms'

// Extended field type that includes the original array index
export type ColumnField = FormFieldBase & { _fieldIndex: number }

interface ColumnContainerProps {
  fields: ColumnField[]
  sectionIndex: number
  columnIndex: number
  columnWidth: number  // 1-12 grid width
  pageIndex?: number
  isPreview?: boolean
  isFirstColumn?: boolean
  isLastColumn?: boolean
  totalColumns: number
}

/**
 * ColumnContainer - Independent column that holds a vertical stack of fields.
 * Each column can have fields added above/below within it, independent of other columns.
 */
export function ColumnContainer({
  fields,
  sectionIndex,
  columnIndex,
  pageIndex = 0,
  isPreview = false,
  isFirstColumn = false,
  isLastColumn = false,
}: ColumnContainerProps) {
  const fieldIds = fields.map((f) => f.id)

  // Simplified: Always 50% width for half-width columns
  // Full-width fields are handled at the row level in SectionContainer
  const getColumnClasses = () => {
    return 'w-full sm:w-1/2'
  }

  // Fixed 50% width for all half-width columns
  const flexStyle = {
    flexBasis: '50%',
    maxWidth: '50%'
  }

  return (
    <div
      className={cn(
        'relative flex-shrink-0 min-h-[60px]',
        getColumnClasses()
      )}
      style={flexStyle}
      data-column-index={columnIndex}
    >
      {/* Horizontal drop zones for creating new columns */}
      {!isPreview && (
        <>
          <HorizontalDropZone
            sectionIndex={sectionIndex}
            columnIndex={columnIndex}
            side="left"
            isFirstColumn={isFirstColumn}
            isLastColumn={isLastColumn}
          />
          <HorizontalDropZone
            sectionIndex={sectionIndex}
            columnIndex={columnIndex}
            side="right"
            isFirstColumn={isFirstColumn}
            isLastColumn={isLastColumn}
          />
        </>
      )}

      {/* Column content */}
      <div className="h-full">
        {fields.length === 0 ? (
          // Empty column drop zone
          !isPreview && (
            <DropZone
              sectionIndex={sectionIndex}
              fieldIndex={0}
              columnIndex={columnIndex}
              isEmpty
            />
          )
        ) : (
          <SortableContext
            items={fieldIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map((field, fieldIndexInColumn) => {
                // Calculate the actual field index in the flat array
                const actualFieldIndex = field._fieldIndex ?? fieldIndexInColumn

                return (
                  <div key={field.id} className="relative">
                    {!isPreview && (
                      <DropZone
                        sectionIndex={sectionIndex}
                        fieldIndex={actualFieldIndex}
                        columnIndex={columnIndex}
                      />
                    )}
                    <FieldContainer
                      field={field}
                      sectionIndex={sectionIndex}
                      fieldIndex={actualFieldIndex}
                      columnIndex={columnIndex}
                      pageIndex={pageIndex}
                      isPreview={isPreview}
                    />
                  </div>
                )
              })}
              {/* Final drop zone at bottom of column */}
              {!isPreview && (
                <DropZone
                  sectionIndex={sectionIndex}
                  fieldIndex={fields.length}
                  columnIndex={columnIndex}
                />
              )}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  )
}

/**
 * Row-based layout grouping (legacy).
 * Groups fields into rows for rendering:
 * - Full-width fields (colSpan: 12) get their own row
 * - Half-width fields (colSpan: 6) are paired by columnIndex (0 = left, 1 = right)
 */
export interface LayoutRow {
  type: 'full' | 'half-pair' | 'half-single'
  fullField?: FormFieldBase & { _fieldIndex: number }
  leftField?: FormFieldBase & { _fieldIndex: number }
  rightField?: FormFieldBase & { _fieldIndex: number }
}

export function groupFieldsForLayout(fields: FormFieldBase[]): LayoutRow[] {
  const rows: LayoutRow[] = []

  // Separate full-width and half-width fields, maintaining order
  const annotatedFields = fields.map((field, index) => ({
    ...field,
    _fieldIndex: index
  }))

  // Process fields in order
  const halfWidthLeft: (FormFieldBase & { _fieldIndex: number })[] = []
  const halfWidthRight: (FormFieldBase & { _fieldIndex: number })[] = []

  annotatedFields.forEach(field => {
    const isFullWidth = !field.colSpan || field.colSpan === 12

    if (isFullWidth) {
      // Full-width field gets its own row
      rows.push({
        type: 'full',
        fullField: field
      })
    } else {
      // Half-width field (colSpan: 6)
      if (field.columnIndex === 1) {
        halfWidthRight.push(field)
      } else {
        halfWidthLeft.push(field)
      }
    }
  })

  // Pair up half-width fields
  const maxPairs = Math.max(halfWidthLeft.length, halfWidthRight.length)
  for (let i = 0; i < maxPairs; i++) {
    const leftField = halfWidthLeft[i]
    const rightField = halfWidthRight[i]

    if (leftField && rightField) {
      rows.push({
        type: 'half-pair',
        leftField,
        rightField
      })
    } else if (leftField) {
      rows.push({
        type: 'half-single',
        leftField
      })
    } else if (rightField) {
      // Enforce "must pair" rule - right field without left should be moved to left
      rows.push({
        type: 'half-single',
        leftField: rightField  // Move to left position
      })
    }
  }

  return rows
}

/**
 * Segment-based layout grouping for masonry-style rendering.
 * Preserves field order by creating segments:
 * - Full-width fields get their own segment
 * - Consecutive half-width fields are grouped into a masonry segment
 * This allows full-width fields to appear between masonry layouts.
 */
export type LayoutSegment =
  | { type: 'full-width'; field: FormFieldBase & { _fieldIndex: number } }
  | { type: 'masonry'; leftFields: (FormFieldBase & { _fieldIndex: number })[]; rightFields: (FormFieldBase & { _fieldIndex: number })[] }

export interface SegmentedLayout {
  segments: LayoutSegment[]
  hasHalfWidthFields: boolean
}

export function groupFieldsForSegmentedLayout(fields: FormFieldBase[]): SegmentedLayout {
  const segments: LayoutSegment[] = []
  let currentMasonryLeft: (FormFieldBase & { _fieldIndex: number })[] = []
  let currentMasonryRight: (FormFieldBase & { _fieldIndex: number })[] = []
  let hasHalfWidthFields = false

  const flushMasonry = () => {
    if (currentMasonryLeft.length > 0 || currentMasonryRight.length > 0) {
      segments.push({
        type: 'masonry',
        leftFields: [...currentMasonryLeft],
        rightFields: [...currentMasonryRight]
      })
      currentMasonryLeft = []
      currentMasonryRight = []
    }
  }

  fields.forEach((field, index) => {
    const annotated = { ...field, _fieldIndex: index }
    const isFullWidth = !field.colSpan || field.colSpan === 12

    if (isFullWidth) {
      // Flush any pending masonry segment before adding full-width
      flushMasonry()
      segments.push({ type: 'full-width', field: annotated })
    } else {
      // Half-width field (colSpan: 6)
      hasHalfWidthFields = true
      if (field.columnIndex === 1) {
        currentMasonryRight.push(annotated)
      } else {
        currentMasonryLeft.push(annotated)
      }
    }
  })

  // Flush any remaining masonry fields
  flushMasonry()

  return { segments, hasHalfWidthFields }
}

/**
 * Legacy column-based layout grouping.
 * Groups all fields by type without preserving order.
 * @deprecated Use groupFieldsForSegmentedLayout instead for proper ordering.
 */
export interface ColumnLayout {
  fullWidthFields: (FormFieldBase & { _fieldIndex: number })[]
  leftColumnFields: (FormFieldBase & { _fieldIndex: number })[]
  rightColumnFields: (FormFieldBase & { _fieldIndex: number })[]
  hasHalfWidthFields: boolean
}

export function groupFieldsForColumnLayout(fields: FormFieldBase[]): ColumnLayout {
  const fullWidthFields: (FormFieldBase & { _fieldIndex: number })[] = []
  const leftColumnFields: (FormFieldBase & { _fieldIndex: number })[] = []
  const rightColumnFields: (FormFieldBase & { _fieldIndex: number })[] = []

  fields.forEach((field, index) => {
    const annotated = { ...field, _fieldIndex: index }
    const isFullWidth = !field.colSpan || field.colSpan === 12

    if (isFullWidth) {
      fullWidthFields.push(annotated)
    } else {
      // Half-width field (colSpan: 6)
      if (field.columnIndex === 1) {
        rightColumnFields.push(annotated)
      } else {
        leftColumnFields.push(annotated)
      }
    }
  })

  return {
    fullWidthFields,
    leftColumnFields,
    rightColumnFields,
    hasHalfWidthFields: leftColumnFields.length > 0 || rightColumnFields.length > 0
  }
}

/**
 * Legacy function for backwards compatibility.
 * Groups fields by their columnIndex property for the old column-based layout.
 */
export function groupFieldsByColumn(fields: FormFieldBase[]): {
  columnIndex: number
  columnWidth: number
  fields: (FormFieldBase & { _fieldIndex: number })[]
}[] {
  // Simplified: only support 2 columns (left = 0, right = 1)
  const leftFields: (FormFieldBase & { _fieldIndex: number })[] = []
  const rightFields: (FormFieldBase & { _fieldIndex: number })[] = []

  fields.forEach((field, index) => {
    const annotated = { ...field, _fieldIndex: index }
    // Only half-width fields go into columns
    if (field.colSpan === 6) {
      if (field.columnIndex === 1) {
        rightFields.push(annotated)
      } else {
        leftFields.push(annotated)
      }
    }
  })

  const columns: {
    columnIndex: number
    columnWidth: number
    fields: (FormFieldBase & { _fieldIndex: number })[]
  }[] = []

  if (leftFields.length > 0) {
    columns.push({
      columnIndex: 0,
      columnWidth: 6,
      fields: leftFields
    })
  }

  if (rightFields.length > 0) {
    columns.push({
      columnIndex: 1,
      columnWidth: 6,
      fields: rightFields
    })
  }

  // If no half-width fields, return empty
  if (columns.length === 0) {
    return [{
      columnIndex: 0,
      columnWidth: 12,
      fields: []
    }]
  }

  return columns
}