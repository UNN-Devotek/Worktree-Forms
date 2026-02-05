'use client'

import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MultiPageForm } from './pages/MultiPageForm'
import { SinglePageForm } from './pages/SinglePageForm'
import { FormTheme } from './theme/FormTheme'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'
import { useFormSubmission } from '@/hooks/use-form-submission'
import { generateZodSchema } from '@/lib/form-validation'
import { FormSchema } from '@/types/group-forms'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { FormUploadProvider } from '@/contexts/form-upload-context'

interface FormRendererProps {
  formSchema: FormSchema
  formId: number
  groupId: number
  allowAnonymous?: boolean
  latestVersionId?: number | null // [VERSIONING]
  onSuccess?: (submissionId: number) => void
}

export function FormRenderer({
  formSchema,
  formId,
  groupId,
  latestVersionId, // [VERSIONING]
  onSuccess
}: FormRendererProps) {
  // Generate Zod validation schema from form schema
  const validationSchema = generateZodSchema(formSchema)

  // Initialize React Hook Form
  const form = useForm<Record<string, any>>({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur',
    defaultValues: {}
  })

  // Auto-save draft functionality
  const { saveDraft, loadDraft, clearDraft } = useDraftAutosave(
    formId,
    formSchema.settings?.allowSave ?? false
  )

  // Form submission handler
  const { submitForm, isSubmitting, error } = useFormSubmission({
    formId,
    groupId,
    latestVersionId, // [VERSIONING]
    onSuccess: (submissionId) => {
      clearDraft()
      onSuccess?.(submissionId)
    }
  })

  // Load draft on mount
  useEffect(() => {
    if (formSchema.settings?.allowSave) {
      const draft = loadDraft()
      if (draft) {
        Object.entries(draft).forEach(([key, value]) => {
          form.setValue(key, value)
        })
      }
    }
  }, [formSchema.settings?.allowSave, loadDraft, form])

  // Auto-save on form changes
  useEffect(() => {
    if (!formSchema.settings?.allowSave) return

    const subscription = form.watch((values) => {
      saveDraft(values)
    })
    return () => subscription.unsubscribe()
  }, [formSchema.settings?.allowSave, form, saveDraft])

  const handleSubmit = async (data: any) => {
    if (formSchema.settings?.confirmBeforeSubmit) {
      const confirmed = window.confirm(
        formSchema.settings.confirmMessage || 'Are you sure you want to submit?'
      )
      if (!confirmed) return
    }

    await submitForm(data)
  }

  const isMultiPage = formSchema.pages.length > 1 ||
                      formSchema.settings?.renderMode === 'conversational'

  return (
    <FormTheme theme={formSchema.theme}>
      <FormUploadProvider groupId={groupId} formId={formId}>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="max-w-4xl mx-auto"
            noValidate
          >
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isMultiPage ? (
              <MultiPageForm
                formSchema={formSchema}
                isSubmitting={isSubmitting}
              />
            ) : (
              <SinglePageForm
                formSchema={formSchema}
                isSubmitting={isSubmitting}
              />
            )}
          </form>
        </FormProvider>
      </FormUploadProvider>
    </FormTheme>
  )
}