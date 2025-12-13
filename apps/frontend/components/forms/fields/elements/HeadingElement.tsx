'use client'

import { forwardRef } from 'react'
import { FormFieldBase } from '@/types/group-forms'
import { cn } from '@/lib/utils'
import { Heading } from 'lucide-react'

interface HeadingElementProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

const sizeClasses: Record<1 | 2 | 3 | 4, string> = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-semibold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-medium'
}

export const HeadingElement = forwardRef<HTMLDivElement, HeadingElementProps>(
  ({ field, mode = 'render' }, ref) => {
    const level = (field.headingLevel || 2) as 1 | 2 | 3 | 4
    const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'

    // Builder mode: Show placeholder if no label
    if (mode === 'builder' && !field.label) {
      return (
        <div
          ref={ref}
          className={cn(
            'p-4 border border-dashed border-border rounded-lg',
            'min-h-[40px] flex items-center gap-2',
            'text-muted-foreground'
          )}
        >
          <Heading className="h-4 w-4" />
          <span className="text-sm">Click to edit heading...</span>
        </div>
      )
    }

    return (
      <div ref={ref}>
        <HeadingTag className={cn(sizeClasses[level], 'text-foreground')}>
          {field.label || 'Heading'}
        </HeadingTag>
        {field.description && (
          <p className="mt-1 text-sm text-muted-foreground">{field.description}</p>
        )}
      </div>
    )
  }
)

HeadingElement.displayName = 'HeadingElement'
