'use client'

import { ReactNode } from 'react'
import { FieldLabel } from './FieldLabel'
import { FieldError } from './FieldError'
import { FieldHelp } from './FieldHelp'
import { cn } from '@/lib/utils'

interface FieldWrapperProps {
  id: string
  label?: string
  helpText?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  labelClassName?: string
  colSpan?: number
}

export function FieldWrapper({
  id,
  label,
  helpText,
  error,
  required,
  children,
  className,
  labelClassName,
  colSpan = 12
}: FieldWrapperProps) {
  return (
    <div
      className={cn(
        'field-wrapper',
        `col-span-${colSpan}`,
        className
      )}
      data-field-wrapper
    >
      {label && (
        <FieldLabel
          htmlFor={id}
          required={required}
          className={labelClassName}
        >
          {label}
        </FieldLabel>
      )}

      {children}

      {helpText && !error && (
        <FieldHelp id={`${id}-help`}>
          {helpText}
        </FieldHelp>
      )}

      {error && (
        <FieldError id={`${id}-error`}>
          {error}
        </FieldError>
      )}
    </div>
  )
}
