'use client'

import { useMemo, useState } from 'react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getFieldComponent } from '@/lib/field-registry'
import { cn } from '@/lib/utils'
import { FormSchema, FormSection as FormSectionType, FormFieldBase } from '@/types/group-forms'
import { calculateFieldProgress } from '@/hooks/use-field-progress'

/**
 * Segment type for layout rendering.
 */
type LayoutSegment =
  | { type: 'full-width'; field: FormFieldBase }
  | { type: 'masonry'; leftFields: FormFieldBase[]; rightFields: FormFieldBase[] }

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
      flushMasonry()
      segments.push({ type: 'full-width', field })
    } else {
      if (field.columnIndex === 1) {
        currentMasonryRight.push(field)
      } else {
        currentMasonryLeft.push(field)
      }
    }
  })

  flushMasonry()
  return segments
}

interface FormRunnerProps {
  formSchema: FormSchema
  mode?: 'preview' | 'fill'
  initialData?: Record<string, any>
  onSubmit?: (data: Record<string, any>) => void
  readOnly?: boolean
  className?: string
}

function RunnerFooter({
  formSchema,
  settings,
  isMultiPage,
  isFirstPage,
  isLastPage,
  currentPageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  readOnly
}: {
  formSchema: FormSchema
  settings: Partial<FormSchema['settings']>
  isMultiPage: boolean
  isFirstPage: boolean
  isLastPage: boolean
  currentPageIndex: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
  readOnly?: boolean
}) {
  const formValues = useWatch()
  const { completedCount, totalRequired, percentage, isComplete } = calculateFieldProgress(formSchema, formValues || {})
  const showProgress = settings.showProgress ?? true

  return (
    <div className="space-y-3 pt-4 border-t mt-6">
      {/* Field Progress Bar */}
      {showProgress && (
        <div className="flex items-center gap-3">
          <Progress
            value={percentage}
            className={cn(
              'h-2 flex-1',
              isComplete && '[&>div]:bg-green-500'
            )}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            <span className={cn(
              'text-sm whitespace-nowrap',
              isComplete ? 'text-green-600 font-medium' : 'text-muted-foreground'
            )}>
              {completedCount}/{totalRequired} required
            </span>
          </div>
        </div>
      )}

      {/* Multi-page indicator */}
      {isMultiPage && (
        <div className="text-center text-sm text-muted-foreground">
          Page {currentPageIndex + 1} of {totalPages}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {isMultiPage && !isFirstPage && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onPrevPage()
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
        </div>
        <div className="flex-1 flex justify-end">
          {isMultiPage && !isLastPage ? (
            <Button
              type="button"
              className='w-full sm:w-auto'
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onNextPage()
              }}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            !readOnly && (
            <Button type="submit" className='w-full sm:w-auto'>
              Submit
            </Button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export function FormRunner({ 
  formSchema, 
  mode = 'fill', 
  initialData, 
  onSubmit, 
  readOnly = false,
  className 
}: FormRunnerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  // Pages setup
  const pages = formSchema?.pages || []
  const totalPages = pages.length
  const isMultiPage = totalPages > 1
  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === totalPages - 1
  const currentPage = pages[currentPageIndex]
  const sections = currentPage?.sections || []
  const settings = formSchema?.settings || {} as Partial<FormSchema['settings']>

  // Default Values
  const defaultValues = useMemo(() => {
    if (initialData) return initialData
    if (!formSchema) return {}
    
    // Fallback to schema defaults
    const defaults: Record<string, any> = {}
    formSchema.pages?.forEach(page => {
      page.sections?.forEach(section => {
        section.fields?.forEach(field => {
          defaults[field.name] = field.defaultValue ?? ''
        })
      })
    })
    return defaults
  }, [formSchema, initialData])

  const methods = useForm({
    mode: 'onBlur',
    defaultValues,
    shouldUnregister: false,
    disabled: readOnly
  })

  // Navigation Handlers
  const handleNextPage = async () => {
    // Validate current page fields before moving?
    // simple trigger() validates everything. 
    // Ideally we'd validate only fields on current page, but for now lets allow free navigation or validate all.
    // Let's validate strictly on Submit, but maybe just soft check here.
    if (!isLastPage) {
      setCurrentPageIndex(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderField = (field: FormFieldBase) => {
    const FieldComponent = getFieldComponent(field.type)
    if (!FieldComponent) {
      return (
        <div key={field.id} className="p-4 bg-muted rounded text-sm text-muted-foreground">
          Unknown field type: {field.type}
        </div>
      )
    }
    return <FieldComponent key={field.id} field={field} mode={mode === 'preview' ? 'render' : 'builder'} /> // 'builder' usually implies editable settings? 
    // Wait, 'mode' in FieldComponent: 
    // 'builder' = shows drag handles usually?
    // 'preview' = simpler?
    // 'render' = ? 
    // Checking PreviewModal: <FieldComponent ... mode="render" />
    // Checking FieldRegistry or TextComponent:
    // Actually, looking at PreviewModal line 300: mode="render".
    // I should use "render" for both 'fill' (FormRunner default) and 'preview'.
    // "builder" is for the drag-and-drop editor.
  }

  const renderSection = (section: FormSectionType, sectionIndex: number) => {
    const fields = section.fields || []
    const segments = groupFieldsIntoSegments(fields)

    return (
      <Card key={section.id || sectionIndex} className="mb-4">
        {section.title && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{section.title}</CardTitle>
            {section.description && (
              <CardDescription>{section.description}</CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              This section is empty
            </p>
          ) : (
            <div className="space-y-4">
              {segments.map((segment, segmentIndex) => {
                if (segment.type === 'full-width') {
                  return (
                    <div key={segment.field.id} className="w-full">
                      {renderField(segment.field)}
                    </div>
                  )
                }
                if (segment.type === 'masonry') {
                  return (
                    <div key={`masonry-${segmentIndex}`} className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="w-full sm:w-1/2 space-y-4">
                        {segment.leftFields.map(field => <div key={field.id}>{renderField(field)}</div>)}
                      </div>
                      <div className="w-full sm:w-1/2 space-y-4">
                        {segment.rightFields.map(field => <div key={field.id}>{renderField(field)}</div>)}
                      </div>
                    </div>
                  )
                }
                return null
              })}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit ? methods.handleSubmit(onSubmit) : (e) => e.preventDefault()} className="space-y-6">
          
          {/* Form Header (Title) */}
          {settings.showTitle !== false && currentPage && (
             <div className="mb-6">
               <h2 className="text-2xl font-bold tracking-tight">{currentPage.title || 'Untitled Page'}</h2>
               {currentPage.description && (
                 <p className="mt-2 text-muted-foreground">{currentPage.description}</p>
               )}
             </div>
          )}

          {/* Sections */}
          {sections.map((section, index) => renderSection(section, index))}

          {/* Empty State */}
          {sections.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No fields on this page.
              </CardContent>
            </Card>
          )}

          {/* Footer / Navigation */}
          <RunnerFooter 
             formSchema={formSchema}
             settings={settings}
             isMultiPage={isMultiPage}
             isFirstPage={isFirstPage}
             isLastPage={isLastPage}
             currentPageIndex={currentPageIndex}
             totalPages={totalPages}
             onPrevPage={handlePrevPage}
             onNextPage={handleNextPage}
             readOnly={readOnly}
          />

        </form>
      </FormProvider>
    </div>
  )
}
