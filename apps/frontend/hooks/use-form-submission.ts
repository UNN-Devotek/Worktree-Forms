'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'
import { useSession } from '@/components/session-provider'

interface UseFormSubmissionProps {
  formId: number
  groupId: number
  latestVersionId?: number | null // [VERSIONING]
  onSuccess?: (submissionId: number) => void
  onError?: (error: string) => void
}

interface SubmitResponse {
  success: boolean
  submission_id?: number
  message?: string
  error?: string
}

export function useFormSubmission({
  formId,
  groupId,
  latestVersionId,
  onSuccess,
  onError
}: UseFormSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const session = useSession()
  const currentUser = session?.user ?? null

  const submitForm = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

    // Check offline status
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!isOnline) {
      try {
        // Import dynamically to avoid SSR issues if any, though IDB is client-side
        const { MutationQueue } = await import('@/lib/sync/mutation-queue');
        const { toast } = await import('sonner');

        const submissionId = Math.floor(Math.random() * 1000000); // Temp ID

        await MutationQueue.enqueue({
          url: `/api/groups/${groupId}/forms/${formId}/submit`,
          method: 'POST',
          body: {
            response_data: data,
            form_version_id: latestVersionId,
            submitted_at: new Date().toISOString(),
            device_type: getDeviceType(),
            user: currentUser
          }
        });

        toast.success("Saved to Outbox. Will sync when online.", { id: 'offline-save' });
        onSuccess?.(submissionId); // Optimistic success
        setIsSubmitting(false);
        return { success: true, submission_id: submissionId, message: 'Saved to Outbox' };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save offline';
        setError(errorMessage);
        onError?.(errorMessage);
        setIsSubmitting(false);
        throw err;
      }
    }

    try {
      const response = await apiClient<SubmitResponse>(
        `/api/groups/${groupId}/forms/${formId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            response_data: data,
            form_version_id: latestVersionId, // [VERSIONING]
            submitted_at: new Date().toISOString(),
            device_type: getDeviceType(),
            user: currentUser
          })
        }
      )

      if (!response.success || !response.submission_id) {
        throw new Error(response.error || 'Failed to submit form')
      }

      onSuccess?.(response.submission_id)

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    submitForm,
    isSubmitting,
    error,
    clearError: () => setError(null)
  }
}

/**
 * Detect device type
 */
function getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}
