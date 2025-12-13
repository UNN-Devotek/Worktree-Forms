'use client'

import { forwardRef, useMemo } from 'react'
import Image from 'next/image'
import { FormFieldBase } from '@/types/group-forms'
import { cn } from '@/lib/utils'
import { ImageIcon } from 'lucide-react'
import { API_BASE } from '@/lib/api'

interface ImageElementProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

/**
 * Get the correct image URL from field data.
 * Prefers imageObjectKey (stored MinIO key) and constructs proper API URL.
 * Falls back to imageUrl if no object key, fixing localhost URLs in production.
 */
function getImageUrl(field: FormFieldBase): string | null {
  // Prefer object key - construct URL dynamically with current API base
  if (field.imageObjectKey) {
    return `${API_BASE}/api/images/${field.imageObjectKey}`
  }

  // Fallback to stored URL, but fix localhost URLs in production
  if (field.imageUrl) {
    // If URL contains localhost but we're not on localhost, fix it
    if (field.imageUrl.includes('localhost:5001') && !API_BASE.includes('localhost')) {
      // Extract the path after /api/images/ and reconstruct with correct base
      const match = field.imageUrl.match(/\/api\/images\/(.+)$/)
      if (match) {
        return `${API_BASE}/api/images/${match[1]}`
      }
    }
    return field.imageUrl
  }

  return null
}

export const ImageElement = forwardRef<HTMLDivElement, ImageElementProps>(
  ({ field, mode = 'render' }, ref) => {
    // Get the proper image URL
    const imageUrl = useMemo(() => getImageUrl(field), [field])

    // Builder mode: Show upload placeholder if no image
    if (mode === 'builder') {
      if (!imageUrl) {
        return (
          <div
            ref={ref}
            className={cn(
              'border-2 border-dashed border-border rounded-lg p-8',
              'flex flex-col items-center justify-center gap-2',
              'text-muted-foreground min-h-[120px]'
            )}
          >
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm">Upload an image in the properties panel</p>
          </div>
        )
      }

      return (
        <div ref={ref} className="relative rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={field.imageAlt || 'Form image'}
            width={800}
            height={400}
            className="w-full h-auto object-cover rounded-lg"
            unoptimized
          />
        </div>
      )
    }

    // Render/Preview mode
    if (!imageUrl) {
      return null
    }

    return (
      <div ref={ref} className="rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt={field.imageAlt || 'Form image'}
          width={800}
          height={400}
          className="w-full h-auto object-cover rounded-lg"
          unoptimized
        />
      </div>
    )
  }
)

ImageElement.displayName = 'ImageElement'
