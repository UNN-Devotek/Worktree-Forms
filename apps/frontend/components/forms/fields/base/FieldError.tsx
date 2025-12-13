'use client'

import { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldErrorProps {
  id: string
  children: ReactNode
  className?: string
}

export function FieldError({ id, children, className }: FieldErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 mt-2 text-sm text-destructive',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  )
}
