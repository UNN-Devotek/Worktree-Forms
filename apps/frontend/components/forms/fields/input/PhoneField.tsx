'use client'

import { forwardRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'
import { Phone } from 'lucide-react'

interface PhoneFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, '')

  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length <= 3) {
    return cleaned
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
  } else {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }
}

const PhoneFieldRender = forwardRef<HTMLInputElement, { field: FormFieldBase }>(
  ({ field }, _ref) => {
    const form = useFormContext()
    const error = form.formState.errors[field.name]?.message as string
    const [displayValue, setDisplayValue] = useState('')

    // Register field with form (for validation and value tracking)
    const { ref: formRef, ...formField } = form.register(field.name)

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
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            {...formField}
            ref={formRef}
            id={field.id}
            type="tel"
            placeholder={field.placeholder || '(555) 123-4567'}
            value={displayValue}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value)
              setDisplayValue(formatted)

              // Store unformatted value in form
              const unformatted = formatted.replace(/\D/g, '')
              form.setValue(field.name, unformatted)
            }}
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

PhoneFieldRender.displayName = 'PhoneFieldRender'

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(
  ({ field, mode = 'render' }, ref) => {
    const [displayValue, setDisplayValue] = useState('')

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
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={field.id}
              type="tel"
              placeholder={field.placeholder || '(555) 123-4567'}
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
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id={field.id}
              type="tel"
              placeholder={field.placeholder || '(555) 123-4567'}
              value={displayValue}
              onChange={(e) => setDisplayValue(formatPhoneNumber(e.target.value))}
              className="pl-10"
              ref={ref}
            />
          </div>
        </FieldWrapper>
      )
    }

    return <PhoneFieldRender field={field} ref={ref} />
  }
)

PhoneField.displayName = 'PhoneField'
