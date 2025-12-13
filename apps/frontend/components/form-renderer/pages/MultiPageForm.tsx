'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormSection } from '../sections/FormSection'
import { PageNavigation } from './PageNavigation'
import { ProgressBar } from '../progress/ProgressBar'
import { ProgressSteps } from '../progress/ProgressSteps'
import { FieldProgressBar } from '../progress/FieldProgressBar'
import { FormSchema } from '@/types/group-forms'
import { useFieldProgress } from '@/hooks/use-field-progress'

interface MultiPageFormProps {
  formSchema: FormSchema
  isSubmitting: boolean
}

export function MultiPageForm({ formSchema, isSubmitting }: MultiPageFormProps) {
  const form = useFormContext()
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  const { completedCount, totalRequired, percentage } = useFieldProgress(formSchema)
  const showFieldProgress = formSchema.settings?.showProgress ?? true

  const currentPage = formSchema.pages[currentPageIndex]

  if (!currentPage) {
    return (
        <div className="p-6 text-center text-muted-foreground">
            No pages defined in this form.
        </div>
    )
  }
  const totalPages = formSchema.pages.length
  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === totalPages - 1

  const handleNext = async () => {
    // Validate current page fields
    const pageFieldNames = currentPage.sections.flatMap(section =>
      section.fields.map(field => field.name)
    )

    const isValid = await form.trigger(pageFieldNames)

    if (isValid && !isLastPage) {
      setCurrentPageIndex(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (!isFirstPage) {
      setCurrentPageIndex(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {formSchema.settings?.showProgress && (
        <div className="mb-8">
          {formSchema.settings.progressStyle === 'bar' ? (
            <ProgressBar current={currentPageIndex + 1} total={totalPages} />
          ) : (
            <ProgressSteps
              steps={formSchema.pages.map(page => page.title || 'Step')}
              currentStep={currentPageIndex}
            />
          )}
        </div>
      )}

      {/* Current Page */}
      <Card>
        <CardHeader>
          {currentPage.title && (
            <CardTitle className="text-2xl">{currentPage.title}</CardTitle>
          )}
          {currentPage.description && (
            <CardDescription className="text-base mt-2">
              {currentPage.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {currentPage.sections.map((section, sectionIndex) => (
            <FormSection
              key={section.id}
              section={section}
              sectionIndex={sectionIndex}
            />
          ))}
        </CardContent>
      </Card>

      {/* Navigation Area with Field Progress */}
      <div className="space-y-4">
        {/* Field Progress Bar */}
        {showFieldProgress && (
          <FieldProgressBar
            completedCount={completedCount}
            totalRequired={totalRequired}
            percentage={percentage}
          />
        )}

        {/* Navigation Buttons */}
        <PageNavigation
          isFirstPage={isFirstPage}
          isLastPage={isLastPage}
          isSubmitting={isSubmitting}
          onNext={handleNext}
          onBack={handleBack}
        />
      </div>
    </div>
  )
}