'use client'

import { useEffect, useState, useCallback } from 'react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur',
    defaultValues: {}
  })

  // Auto-save draft functionality
  const { saveDraft, loadDraft, clearDraft } = useDraftAutosave(
    formId,
    formSchema.settings?.allowSave ?? false
  )

  const [pendingData, setPendingData] = useState<Record<string, unknown> | null>(null)

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

  // Load draft on mount (or when formId changes)
  useEffect(() => {
    if (!formSchema.settings?.allowSave) return
    let cancelled = false
    const draft = loadDraft()
    if (draft && !cancelled) {
      Object.entries(draft).forEach(([key, value]) => {
        form.setValue(key, value)
      })
    }
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, formSchema.settings?.allowSave, loadDraft])

  // Auto-save on form changes
  useEffect(() => {
    if (!formSchema.settings?.allowSave) return

    const subscription = form.watch((values) => {
      saveDraft(values)
    })
    return () => subscription.unsubscribe()
  }, [formSchema.settings?.allowSave, form, saveDraft])

  const handleConfirmedSubmit = useCallback(async (data: Record<string, unknown>) => {
    await submitForm(data)
  }, [submitForm])

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (formSchema.settings?.confirmBeforeSubmit) {
      setPendingData(data)
      return
    }

    await handleConfirmedSubmit(data)
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
      <AlertDialog open={pendingData !== null} onOpenChange={(open) => { if (!open) setPendingData(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm submission</AlertDialogTitle>
            <AlertDialogDescription>
              {formSchema.settings?.confirmMessage || 'Are you sure you want to submit?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingData) {
                  handleConfirmedSubmit(pendingData)
                  setPendingData(null)
                }
              }}
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormTheme>
  )
}