'use client'

import { forwardRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'
import { Mail } from 'lucide-react'

interface EmailFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

const EmailFieldRender = forwardRef<HTMLInputElement, { field: FormFieldBase }>(
  ({ field }, _ref) => {
    const form = useFormContext()
    const { ref: formRef, ...formField } = form.register(field.name)
    const error = form?.formState?.errors[field.name]?.message as string

    return (
      <FieldWrapper
        id={field.id}
        label={field.label}
        helpText={field.helpText}
        error={error}
        required={field.required}
        colSpan={field.colSpan}
      >
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            {...formField}
            ref={formRef}
            id={field.id}
            type="email"
            placeholder={field.placeholder || 'your.email@example.com'}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${field.id}-error`
                : field.helpText
                ? `${field.id}-help`
                : undefined
            }
            className="pl-10"
          />
        </div>
      </FieldWrapper>
    )
  }
)

EmailFieldRender.displayName = 'EmailFieldRender'

export const EmailField = forwardRef<HTMLInputElement, EmailFieldProps>(
  ({ field, mode = 'render' }, ref) => {
    if (mode === 'builder') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={field.id}
              type="email"
              placeholder={field.placeholder || 'your.email@example.com'}
              disabled
              className="pl-10 cursor-not-allowed"
            />
          </div>
        </FieldWrapper>
      )
    }

    // Preview mode: enabled input without form context
    if (mode === 'preview') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id={field.id}
              type="email"
              placeholder={field.placeholder || 'your.email@example.com'}
              className="pl-10"
              ref={ref}
            />
          </div>
        </FieldWrapper>
      )
    }

    return <EmailFieldRender field={field} ref={ref} />
  }
)

EmailField.displayName = 'EmailField'
