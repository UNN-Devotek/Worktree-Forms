'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Loader2, Globe, Lock } from 'lucide-react'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
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
  formId?: number
  groupId: number
  groupSlug?: string
  formType?: FormType
}

export function SaveButton({ formId, groupId, formType = 'general' }: SaveButtonProps) {
  const { formSchema, isDirty, setDirty } = useFormBuilderStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch current publish status on mount
  useEffect(() => {
    const fetchFormStatus = async () => {
      if (!formId) return
      try {
        const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
          `/api/groups/${groupId}/forms/${formId}`
        )
        if (response.success && response.data) {
          setIsPublished(response.data.form.is_published)
        }
      } catch (error) {
        console.error('Failed to fetch form status:', error)
      }
    }
    fetchFormStatus()
  }, [formId, groupId])

  const handleSave = async (): Promise<boolean> => {
    if (!formSchema) {
        console.warn('Save attempted but formSchema is null')
        return false
    }

    console.log('Saving form:', { formId, groupId, isNew: !formId })
    setIsSaving(true)
    try {
      if (formId) {
        // Update existing form
        const oneResponsePerUser = formSchema.settings?.oneResponsePerUser ?? false
        const allowMultiple = !oneResponsePerUser
        const sigIds = formSchema.settings?.sig_ids || []
        
        const payload = {
            title: formSchema.settings?.title || formSchema.pages[0]?.title || 'Untitled Form',
            form_json: formSchema,
            allow_multiple_submissions: allowMultiple,
            sig_ids: sigIds
        }

        console.log('Sending PUT request to', `/api/groups/${groupId}/forms/${formId}`, payload)

        const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
          `/api/groups/${groupId}/forms/${formId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        )

        console.log('Save response:', response)

        if (!response.success) {
          throw new Error(response.error || 'Failed to update form')
        }

        setDirty(false)
        toast({
          title: 'Form saved',
          description: 'Your changes have been saved successfully.'
        })
        return true
      } else {
        // Create new form
        const oneResponsePerUser = formSchema.settings?.oneResponsePerUser ?? false
        const allowMultiple = !oneResponsePerUser
        const sigIds = formSchema.settings?.sig_ids || []

        const folderIdParam = new URLSearchParams(window.location.search).get('folderId')
        const folderId = folderIdParam ? parseInt(folderIdParam) : undefined

        const createData: CreateFormData = {
          title: formSchema.settings?.title || formSchema.pages[0]?.title || 'Untitled Form',
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
          folderId: folderId
        }
        
        console.log('Sending POST request to', `/api/groups/${groupId}/forms`, createData)

        const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
          `/api/groups/${groupId}/forms`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData)
          }
        )

        console.log('Create response:', response)

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to create form')
        }

        toast({
          title: 'Form created',
          description: 'Your form has been created successfully.'
        })

        const formSlug = response.data.form.slug
        router.push(`/forms/${formSlug}/edit`)
        return true
      }
    } catch (error) {
      console.error('Save error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to save form'
      
      // Handle specific error cases
      if (errorMessage.includes('404')) {
          toast({
              title: 'Form not found',
              description: 'This form may have been deleted. Please try refreshing the page.',
              variant: 'destructive'
          })
      } else {
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive'
          })
      }
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!formId) {
      toast({
        title: 'Save first',
        description: 'Please save the form before publishing.',
        variant: 'destructive'
      })
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
      const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
        `/api/groups/${groupId}/forms/${formId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_published: true })
        }
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to publish form')
      }

      setIsPublished(true)
      toast({
        title: 'Form published',
        description: 'Your form is now visible to members.'
      })
    } catch (error) {
      console.error('Publish error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to publish form',
        variant: 'destructive'
      })
    } finally {
      setIsPublishing(false)
      setShowPublishDialog(false)
    }
  }

  const handleUnpublish = async () => {
    if (!formId) return

    setIsPublishing(true)
    try {
      const response = await apiClient<ApiResponse<{ form: GroupForm }>>(
        `/api/groups/${groupId}/forms/${formId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_published: false })
        }
      )

      if (!response.success) {
        throw new Error(response.error || 'Failed to unpublish form')
      }

      setIsPublished(false)
      toast({
        title: 'Form unpublished',
        description: 'Your form is now a draft and hidden from members.'
      })
    } catch (error) {
      console.error('Unpublish error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unpublish form',
        variant: 'destructive'
      })
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