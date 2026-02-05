'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormSection } from '../sections/FormSection'
import { SubmitButton } from '../submission/SubmitButton'
import { FieldProgressBar } from '../progress/FieldProgressBar'
import { useFieldProgress } from '@/hooks/use-field-progress'
import { FormSchema } from '@/types/group-forms'

interface SinglePageFormProps {
  formSchema: FormSchema
  isSubmitting: boolean
}

export function SinglePageForm({ formSchema, isSubmitting }: SinglePageFormProps) {
  const { completedCount, totalRequired, percentage } = useFieldProgress(formSchema)
  const showProgress = formSchema.settings?.showProgress ?? true
  const page = formSchema.pages[0]

  if (!page) {
    return (
        <div className="p-6 text-center text-muted-foreground">
            No pages defined in this form.
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          {page.title && (
            <CardTitle className="text-2xl">{page.title}</CardTitle>
          )}
          {page.description && (
            <CardDescription className="text-base mt-2">
              {page.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {page.sections.map((section, sectionIndex) => (
            <FormSection
              key={section.id}
              section={section}
              sectionIndex={sectionIndex}
            />
          ))}
        </CardContent>
      </Card>

      {/* Submit Area with Progress */}
      <div className="flex items-center gap-4">
        {showProgress && (
          <FieldProgressBar
            completedCount={completedCount}
            totalRequired={totalRequired}
            percentage={percentage}
          />
        )}
        <SubmitButton
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
