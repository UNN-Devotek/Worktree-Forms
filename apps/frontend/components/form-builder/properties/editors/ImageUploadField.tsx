'use client'

import { useState, useRef, useMemo } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { X, ImageIcon, Loader2 } from 'lucide-react'
import { apiClient, API_BASE } from '@/lib/api'
import { toast } from 'sonner'

interface UploadResponse {
  success: boolean
  data?: {
    files: Array<{
      filename: string
      object_key: string
      url: string
      size: number
      content_type: string
    }>
  }
  error?: string
}

interface ImageUploadFieldProps {
  groupId: number
  formId?: number
  currentUrl?: string
  currentObjectKey?: string
  onUpload: (objectKey: string, url: string) => void
}

/**
 * Get the correct display URL for the image preview.
 * Prefers object key and constructs proper API URL.
 */
function getDisplayUrl(currentObjectKey?: string, currentUrl?: string): string | null {
  // Prefer object key - construct URL dynamically
  if (currentObjectKey) {
    return `${API_BASE}/api/images/${currentObjectKey}`
  }

  // Fallback to stored URL, but fix localhost URLs in production
  if (currentUrl) {
    return currentUrl
  }

  return null
}

export function ImageUploadField({ groupId, formId, currentUrl, currentObjectKey, onUpload }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get the correct display URL
  const displayUrl = useMemo(
    () => getDisplayUrl(currentObjectKey, currentUrl),
    [currentObjectKey, currentUrl]
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB')
      return
    }

    // Check if we have the required params - formId is required for uploads
    if (!groupId || !formId) {
      toast.error('Please save the form first before uploading images')
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient<UploadResponse>(
        `/api/groups/${groupId}/forms/${formId}/upload`,
        {
          method: 'POST',
          body: formData,
          isFormData: true,
        }
      )

      if (response.success && response.data?.files?.[0]) {
        const uploaded = response.data.files[0]
        onUpload(uploaded.object_key, uploaded.url)
        toast.success('Image uploaded successfully')
      } else {
        toast.error(response.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onUpload('', '')
  }

  if (displayUrl) {
    return (
      <div className="space-y-2">
        <div className="relative group rounded-lg overflow-hidden border">
          <Image
            src={displayUrl}
            alt="Uploaded image"
            width={300}
            height={200}
            className="w-full h-auto object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!uploading) {
            fileInputRef.current?.click()
          }
        }}
        disabled={uploading}
        className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
        ) : (
          <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {uploading ? 'Uploading...' : 'Click to upload image'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max 20MB
        </p>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        aria-label="Upload image file"
      />
    </div>
  )
}
