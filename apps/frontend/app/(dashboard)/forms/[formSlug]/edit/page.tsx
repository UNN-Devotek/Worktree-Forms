'use client'

import { useEffect, useState } from 'react'
import { FormBuilderLayout } from '@/features/forms/components/builder/FormBuilderLayout'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { GroupForm } from '@/types/group-forms'
import { ApiResponse } from '@/types/api'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditFormPage() {
  const params = useParams()
  const router = useRouter()
  const [form, setForm] = useState<GroupForm | null>(null)
  const [loading, setLoading] = useState(true)

  const formSlug = params.formSlug as string

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await apiClient<ApiResponse<GroupForm>>(
          `/api/forms?slug=${encodeURIComponent(formSlug)}`
        )

        if (response.success && response.data) {
          setForm(response.data)
        } else {
          toast.error("Form not found", { description: "The requested form could not be found." })
          router.push('/forms')
        }
      } catch (error) {
        console.error('Error fetching form:', error)
        toast.error("Error", { description: "Failed to load form data." })
      } finally {
        setLoading(false)
      }
    }

    if (formSlug) {
      fetchForm()
    }
  }, [formSlug, router])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!form) {
    return null // Handled by redirect
  }

  return (
    <FormBuilderLayout
      groupId={form.group_id}
      formId={form.id}
      formSlug={form.slug}
      formTitle={form.title}
      formType={form.form_type}
      initialSchema={form.form_schema}
      isNewForm={false}
      isSIGRequestForm={form.is_sig_request_form}
      targetSheetId={form.targetSheetId}
    />
  )
}
