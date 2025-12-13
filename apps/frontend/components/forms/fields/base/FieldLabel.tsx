'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldLabelProps {
  htmlFor: string
  children: ReactNode
  required?: boolean
  className?: string
}

export function FieldLabel({
  htmlFor,
  children,
  required,
  className
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-sm font-medium mb-2',
        'text-foreground',
        className
      )}
    >
      {children}
      {required && (
        <span
          className="text-destructive ml-1"
          aria-label="required"
        >
          *
        </span>
      )}
    </label>
  )
}
