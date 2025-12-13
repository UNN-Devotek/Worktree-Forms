'use client'

import { useState, useMemo } from 'react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Monitor, Tablet, Smartphone, RotateCcw, CheckCircle2, Eye, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'
import { getFieldComponent } from '@/lib/field-registry'
import { FormViewer } from '@/components/groups/forms/form-viewer'
import { cn } from '@/lib/utils'
import { FormSchema, FormSection as FormSectionType, FormFieldBase } from '@/types/group-forms'
import { calculateFieldProgress } from '@/hooks/use-field-progress'

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

interface PreviewModalProps {
  open: boolean
  onClose: () => void
}

interface PreviewFormFooterProps {
  formSchema: FormSchema
  settings: Partial<FormSchema['settings']>
  isMultiPage: boolean
  isFirstPage: boolean
  isLastPage: boolean
  currentPageIndex: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
}

/**
 * Form footer component that tracks field progress using useWatch.
 * Must be rendered inside FormProvider context.
 */
function PreviewFormFooter({
  formSchema,
  settings,
  isMultiPage,
  isFirstPage,
  isLastPage,
  currentPageIndex,
  totalPages,
  onPrevPage,
  onNextPage
}: PreviewFormFooterProps) {
  // Watch all form values to calculate progress
  const formValues = useWatch()
  const { completedCount, totalRequired, percentage, isComplete } = calculateFieldProgress(formSchema, formValues || {})
  const showProgress = settings.showProgress ?? true

  return (
    <div className="space-y-3 pt-4">
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
      <div className="flex items-center justify-between">
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
        <div>
          {isMultiPage && !isLastPage ? (
            <Button
              type="button"
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
            <Button type="submit">
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'
type PreviewState = 'fill' | 'submitted'

const deviceConfig = {
  desktop: {
    width: '100%',
    maxWidth: '1200px',
    height: '100%',
    label: 'Desktop',
    icon: Monitor
  },
  tablet: {
    width: '768px',
    maxWidth: '768px',
    height: '1024px',
    label: 'Tablet (768x1024)',
    icon: Tablet
  },
  mobile: {
    width: '375px',
    maxWidth: '375px',
    height: '812px',
    label: 'Mobile (375x812)',
    icon: Smartphone
  }
}

export function PreviewModal({ open, onClose }: PreviewModalProps) {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [previewState, setPreviewState] = useState<PreviewState>('fill')
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  const { formSchema } = useFormBuilderStore()
  const config = deviceConfig[deviceType]

  // Multi-page support
  const pages = formSchema?.pages || []
  const totalPages = pages.length
  const isMultiPage = totalPages > 1
  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === totalPages - 1

  // Generate default values from schema
  const defaultValues = useMemo(() => {
    if (!formSchema) return {}
    const defaults: Record<string, any> = {}
    formSchema.pages?.forEach(page => {
      page.sections?.forEach(section => {
        section.fields?.forEach(field => {
          defaults[field.name] = field.defaultValue ?? ''
        })
      })
    })
    return defaults
  }, [formSchema])

  // React Hook Form
  // shouldUnregister: false ensures field values persist when navigating between pages
  // This is critical for multi-page forms where fields unmount when switching pages
  const methods = useForm({
    mode: 'onBlur',
    defaultValues,
    shouldUnregister: false
  })

  const { handleSubmit, reset } = methods

  // Handle form submission
  const onSubmit = (data: Record<string, any>) => {
    setSubmittedData(data)
    setPreviewState('submitted')
  }

  // Reset and try again
  const handleReset = () => {
    reset(defaultValues)
    setSubmittedData(null)
    setPreviewState('fill')
    setCurrentPageIndex(0)
  }

  // Multi-page navigation
  const handleNextPage = () => {
    if (!isLastPage) {
      setCurrentPageIndex(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex(prev => prev - 1)
    }
  }

  // Close and reset state
  const handleClose = () => {
    handleReset()
    onClose()
  }

  // Get settings with proper type
  const settings = formSchema?.settings || {} as Partial<FormSchema['settings']>

  // Render a single field
  const renderField = (field: FormFieldBase) => {
    const FieldComponent = getFieldComponent(field.type)

    if (!FieldComponent) {
      return (
        <div key={field.id} className="p-4 bg-muted rounded text-sm text-muted-foreground">
          Unknown field type: {field.type}
        </div>
      )
    }

    return <FieldComponent key={field.id} field={field} mode="render" />
  }

  // Render a section with segmented layout
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
              No fields in this section
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
                      {/* Left column - independent vertical stack */}
                      <div className="w-full sm:w-1/2 space-y-4">
                        {segment.leftFields.map(field => (
                          <div key={field.id}>
                            {renderField(field)}
                          </div>
                        ))}
                      </div>

                      {/* Right column - independent vertical stack */}
                      <div className="w-full sm:w-1/2 space-y-4">
                        {segment.rightFields.map(field => (
                          <div key={field.id}>
                            {renderField(field)}
                          </div>
                        ))}
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

  // Get current page and sections
  const currentPage = pages[currentPageIndex]
  const sections = currentPage?.sections || []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>Form Preview</DialogTitle>
              {previewState === 'submitted' && (
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {previewState === 'submitted' && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              )}
              <ToggleGroup
                type="single"
                value={deviceType}
                onValueChange={(value: string) => value && setDeviceType(value as DeviceType)}
                className="gap-1"
              >
                {Object.entries(deviceConfig).map(([key, conf]) => {
                  const Icon = conf.icon
                  return (
                    <ToggleGroupItem
                      key={key}
                      value={key}
                      aria-label={conf.label}
                      title={conf.label}
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <Icon className="h-4 w-4" />
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {config.label} {previewState === 'fill' ? '- Fill out the form below' : '- Viewing submission'}
          </p>
        </DialogHeader>

        {/* Device Frame */}
        <div className="flex-1 overflow-hidden flex items-start justify-center bg-muted/50 rounded-lg p-4">
          <div
            className={cn(
              'bg-background border rounded-lg overflow-auto shadow-lg transition-all duration-300',
              deviceType !== 'desktop' && 'mx-auto'
            )}
            style={{
              width: config.width,
              maxWidth: config.maxWidth,
              height: deviceType === 'desktop' ? '100%' : config.height,
              maxHeight: '100%'
            }}
          >
            {/* Device Header Bar (for mobile/tablet) */}
            {deviceType !== 'desktop' && (
              <div className="h-6 bg-muted border-b flex items-center justify-center gap-1">
                <div className="w-16 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Form Content */}
            <div className="p-4 overflow-auto" style={{ height: deviceType === 'desktop' ? '100%' : `calc(${config.height} - 24px)` }}>
              {previewState === 'fill' ? (
                <FormProvider {...methods}>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Form Title/Description */}
                    {settings.showTitle !== false && currentPage && (
                      <div className="mb-4">
                        <h2 className="text-2xl font-semibold">{currentPage.title || 'Untitled Form'}</h2>
                        {currentPage.description && (
                          <p className="mt-1 text-muted-foreground">{currentPage.description}</p>
                        )}
                      </div>
                    )}

                    {/* Sections */}
                    {sections.map((section, index) => renderSection(section, index))}

                    {/* Empty State */}
                    {sections.length === 0 && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <p className="text-muted-foreground">This page has no fields yet.</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Navigation and Submit - Always show for multi-page or when there are sections */}
                    {(sections.length > 0 || isMultiPage) && (
                      <PreviewFormFooter
                        formSchema={formSchema!}
                        settings={settings}
                        isMultiPage={isMultiPage}
                        isFirstPage={isFirstPage}
                        isLastPage={isLastPage}
                        currentPageIndex={currentPageIndex}
                        totalPages={totalPages}
                        onPrevPage={handlePrevPage}
                        onNextPage={handleNextPage}
                      />
                    )}
                  </form>
                </FormProvider>
              ) : (
                // Submitted State - View Results
                <div className="space-y-4">
                  {/* Success Alert */}
                  <Alert className="border-primary bg-primary/10 dark:bg-primary/5">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <AlertTitle className="text-primary dark:text-primary">
                      Form Submitted Successfully!
                    </AlertTitle>
                    <AlertDescription className="text-primary/80 dark:text-primary/70">
                      {settings.successMessage || 'Thank you for your submission.'}
                    </AlertDescription>
                  </Alert>

                  {/* View Submission */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Your Submission
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {formSchema && submittedData ? (
                        <FormViewer
                          formSchema={formSchema}
                          responseData={submittedData}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Unable to display submission
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Back to Form Button */}
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={handleReset}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Fill Out Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
