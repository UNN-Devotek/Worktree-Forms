'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api'

interface UseFormSubmissionProps {
  formId: number
  groupId: number
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
  onSuccess,
  onError
}: UseFormSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitForm = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

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
            submitted_at: new Date().toISOString(),
            device_type: getDeviceType(),
            user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
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
