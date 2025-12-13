'use client'

import { createContext, useContext, ReactNode } from 'react'
import { apiClient } from '@/lib/api'
import { ApiResponse } from '@/types/api'

interface UploadedFile {
  filename: string
  object_key: string
  url: string
  size: number
  content_type: string
}

interface UploadResponse {
  files: UploadedFile[]
}

interface FormUploadContextType {
  uploadFile: (file: File) => Promise<UploadedFile | null>
  isConfigured: boolean
}

const FormUploadContext = createContext<FormUploadContextType>({
  uploadFile: async () => null,
  isConfigured: false
})

interface FormUploadProviderProps {
  children: ReactNode
  groupId: number | string
  formId: number | string
}

export function FormUploadProvider({ children, groupId, formId }: FormUploadProviderProps) {
  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    try {
      const formData = new FormData()
      formData.append('files', file)

      const response = await apiClient<ApiResponse<UploadResponse>>(
        `/api/groups/${groupId}/forms/${formId}/upload`,
        {
          method: 'POST',
          body: formData,
          isFormData: true  // Don't set Content-Type, let browser handle it
        }
      )

      if (response.success && response.data?.files?.[0]) {
        return response.data.files[0]
      }

      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('Upload failed:', response.error)
      }
      return null
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('File upload error:', error)
      }
      return null
    }
  }

  return (
    <FormUploadContext.Provider value={{ uploadFile, isConfigured: true }}>
      {children}
    </FormUploadContext.Provider>
  )
}

export function useFormUpload() {
  return useContext(FormUploadContext)
}
