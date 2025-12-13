'use client'

import { SectionTitle } from './SectionTitle'
import { getFieldComponent } from '@/lib/field-registry'
import { FormSection as FormSectionType, FormFieldBase } from '@/types/group-forms'

interface FormSectionProps {
  section: FormSectionType
  sectionIndex: number
}

/**
 * Segment type for layout rendering.
 * Preserves field order by creating segments:
 * - Full-width fields get their own segment
 * - Consecutive half-width fields are grouped into a masonry segment
 */
type LayoutSegment =
  | { type: 'full-width'; field: FormFieldBase }
  | { type: 'masonry'; leftFields: FormFieldBase[]; rightFields: FormFieldBase[] }

/**
 * Group fields into segments that preserve order.
 * This allows full-width fields to appear between masonry layouts.
 */
function groupFieldsIntoSegments(fields: FormFieldBase[]): LayoutSegment[] {
  const segments: LayoutSegment[] = []
  let currentMasonryLeft: FormFieldBase[] = []
  let currentMasonryRight: FormFieldBase[] = []

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

  fields.forEach(field => {
    const isFullWidth = !field.colSpan || field.colSpan === 12

    if (isFullWidth) {
      // Flush any pending masonry segment before adding full-width
      flushMasonry()
      segments.push({ type: 'full-width', field })
    } else {
      // Half-width field (colSpan: 6)
      if (field.columnIndex === 1) {
        currentMasonryRight.push(field)
      } else {
        currentMasonryLeft.push(field)
      }
    }
  })

  // Flush any remaining masonry fields
  flushMasonry()

  return segments
}

export function FormSection({ section }: FormSectionProps) {
  const segments = groupFieldsIntoSegments(section.fields)

  return (
    <div className="space-y-6">
      {/* Section Title */}
      {section.title && (
        <SectionTitle title={section.title} />
      )}

      {/* Fields - Segment-based layout (preserves order) */}
      <div className="space-y-4">
        {segments.map((segment, segmentIndex) => {
          if (segment.type === 'full-width') {
            const FieldComponent = getFieldComponent(segment.field.type)
            if (!FieldComponent) {
              console.warn(`No component found for field type: ${segment.field.type}`)
              return null
            }
            return (
              <div key={segment.field.id} className="w-full">
                <FieldComponent field={segment.field} mode="render" />
              </div>
            )
          }

          if (segment.type === 'masonry') {
            return (
              <div key={`masonry-${segmentIndex}`} className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Left column - independent vertical stack */}
                <div className="w-full sm:w-1/2 space-y-4">
                  {segment.leftFields.map(field => {
                    const FieldComponent = getFieldComponent(field.type)
                    if (!FieldComponent) return null
                    return (
                      <div key={field.id}>
                        <FieldComponent field={field} mode="render" />
                      </div>
                    )
                  })}
                </div>

                {/* Right column - independent vertical stack */}
                <div className="w-full sm:w-1/2 space-y-4">
                  {segment.rightFields.map(field => {
                    const FieldComponent = getFieldComponent(field.type)
                    if (!FieldComponent) return null
                    return (
                      <div key={field.id}>
                        <FieldComponent field={field} mode="render" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
