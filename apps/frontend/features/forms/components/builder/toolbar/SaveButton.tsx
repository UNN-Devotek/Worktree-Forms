'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Loader2, Globe, Lock } from 'lucide-react'
import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'
import { apiClient } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'
import { GroupForm, CreateFormData, FormType } from '@/types/group-forms'
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

interface SaveButtonProps {
  formId?: string | number
  groupId: string | number | null
  groupSlug?: string
  formType?: FormType
  projectId?: string
  projectSlug?: string
}

export function SaveButton({ formId, groupId, groupSlug, formType = 'general', projectId, projectSlug }: SaveButtonProps) {
  const { formSchema, isDirty, setDirty } = useFormBuilderStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Fetch current publish status on mount
  useEffect(() => {
    const fetchFormStatus = async () => {
      if (!formId) return
      try {
        const endpoint = projectId
          ? `/api/projects/${projectId}/forms`
          : `/api/groups/${groupId}/forms/${formId}`
        const response = await apiClient<ApiResponse<{ form: GroupForm } | { forms: any[] }>>(endpoint)
        if (response.success && response.data) {
          if ('forms' in response.data) {
            const found = response.data.forms.find((f: any) => (f.formId ?? f.id) === String(formId))
            if (found) setIsPublished(found.status === 'PUBLISHED' || found.is_published)
          } else if ('form' in response.data) {
            setIsPublished(response.data.form.is_published)
          }
        }
      } catch (error) {
        console.error('Failed to fetch form status:', error)
      }
    }
    fetchFormStatus()
  }, [formId, groupId, projectId])

  const handleSave = async (): Promise<boolean> => {
    if (!formSchema) {
        console.warn('Save attempted but formSchema is null')
        return false
    }

    setIsSaving(true)
    try {
      if (formId) {
        // Update existing form
        const title = formSchema.settings?.title || formSchema.pages[0]?.title || 'Untitled Form'
        const payload = {
          title,
          form_json: formSchema,
          name: title,
          schema: formSchema,
        }

        // Prefer project-scoped endpoint (DynamoDB); fall back to legacy groups endpoint
        const updateEndpoint = projectId
          ? `/api/projects/${projectId}/forms/${formId}`
          : `/api/groups/${groupId}/forms/${formId}`

        const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
          updateEndpoint,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        )

        if (!response.success) {
          throw new Error(response.error || 'Failed to update form')
        }

        setDirty(false)
        toast.success('Form saved', { description: 'Your changes have been saved successfully.' })
        return true
      } else {
        // Create new form
        const title = formSchema.settings?.title || formSchema.pages[0]?.title || 'Untitled Form'
        const folderIdParam = searchParams.get('folderId')
        const folderId = folderIdParam ?? undefined

        if (projectId) {
          // Project-scoped create — auto-creates linked Sheet
          const response = await apiClient<ApiResponse<{ form: GroupForm; sheet: any }>>(
            `/api/projects/${projectId}/forms`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title,
                form_json: formSchema,
                folderId,
              }),
            }
          )

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to create form')
          }

          toast.success('Form created', { description: 'Your form and linked table have been created.' })
          const createdForm = response.data.form as any
          const createdId = createdForm.formId ?? createdForm.id ?? createdForm.slug
          router.push(`/project/${projectSlug}/forms/${createdId}`)
          return true
        }

        // Global (non-project) create
        const oneResponsePerUser = formSchema.settings?.oneResponsePerUser ?? false
        const allowMultiple = !oneResponsePerUser
        const sigIds = formSchema.settings?.sig_ids || []

        const createData: CreateFormData = {
          title,
          description: formSchema.pages[0]?.description || '',
          form_type: formType,
          form_json: formSchema,
          is_active: true,
          is_published: false,
          allow_multiple_submissions: allowMultiple,
          requires_approval: false,
          visible_to_non_members: false,
          visible_to_members: true,
          sig_ids: sigIds,
          folderId: folderId ? Number(folderId) : undefined,
          groupSlug: groupSlug,
        }

        const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
          `/api/groups/${groupId}/forms`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData),
          }
        )

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to create form')
        }

        toast.success('Form created', { description: 'Your form has been created successfully.' })

        const formSlug = response.data.form.slug
        router.push(`/forms/${formSlug}/edit`)
        return true
      }
    } catch (error) {
      console.error('Save error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to save form'
      
      // Handle specific error cases
      if (errorMessage.includes('404')) {
          toast.error('Form not found', { description: 'This form may have been deleted. Please try refreshing the page.' })
      } else {
          toast.error('Error', { description: errorMessage })
      }
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!formId) {
      toast.error('Save first', { description: 'Please save the form before publishing.' })
      return
    }

    setIsPublishing(true)
    try {
      // If there are unsaved changes, save first
      if (isDirty) {
        const saved = await handleSave()
        if (!saved) {
          setIsPublishing(false)
          return
        }
      }

      // Now publish
      const publishEndpoint = projectId
        ? `/api/projects/${projectId}/forms/${formId}`
        : `/api/groups/${groupId}/forms/${formId}`
      const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
        publishEndpoint,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_published: true, status: 'PUBLISHED' })
        }
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to publish form')
      }

      setIsPublished(true)
      toast.success('Form published', { description: 'Your form is now visible to members.' })
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Error', { description: error instanceof Error ? error.message : 'Failed to publish form' })
    } finally {
      setIsPublishing(false)
      setShowPublishDialog(false)
    }
  }

  const handleUnpublish = async () => {
    if (!formId) return

    setIsPublishing(true)
    try {
      const unpublishEndpoint = projectId
        ? `/api/projects/${projectId}/forms/${formId}`
        : `/api/groups/${groupId}/forms/${formId}`
      const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
        unpublishEndpoint,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_published: false, status: 'DRAFT' })
        }
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to unpublish form')
      }

      setIsPublished(false)
      toast.success('Form unpublished', { description: 'Your form is now a draft and hidden from members.' })
    } catch (error) {
      console.error('Unpublish error:', error)
      toast.error('Error', { description: error instanceof Error ? error.message : 'Failed to unpublish form' })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status badge */}
        {formId && (
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished ? (
              <>
                <Globe className="h-3 w-3 mr-1" />
                Published
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Draft
              </>
            )}
          </Badge>
        )}

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          variant="outline"
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </Button>

        {/* Publish/Unpublish button */}
        {formId && (
          isPublished ? (
            <Button
              onClick={handleUnpublish}
              disabled={isPublishing}
              variant="outline"
              className="gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Unpublishing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Unpublish
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setShowPublishDialog(true)}
              disabled={isPublishing}
              className="gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
          )
        )}
      </div>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Form</AlertDialogTitle>
            <AlertDialogDescription>
              {isDirty
                ? 'You have unsaved changes. Publishing will save your changes and make the form visible to members.'
                : 'This will make your form visible to members based on the visibility settings.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  {isDirty ? 'Save & Publish' : 'Publish'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}