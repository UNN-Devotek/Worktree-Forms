'use client'

import { forwardRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'

interface TextFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

// Inner component for render mode with form context
const TextFieldRender = forwardRef<HTMLInputElement, { field: FormFieldBase }>(
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
        <Input
          {...formField}
          ref={formRef}
          id={field.id}
          type="text"
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${field.id}-error`
              : field.helpText
              ? `${field.id}-help`
              : undefined
          }
        />
      </FieldWrapper>
    )
  }
)

TextFieldRender.displayName = 'TextFieldRender'

// Outer component that handles builder/render/preview mode
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
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
          <Input
            id={field.id}
            type="text"
            placeholder={field.placeholder}
            disabled
            className="cursor-not-allowed"
          />
        </FieldWrapper>
      )
    }

    // Preview mode: enabled input without form context (for form builder preview)
    if (mode === 'preview') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <Input
            id={field.id}
            type="text"
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            ref={ref}
          />
        </FieldWrapper>
      )
    }

    return <TextFieldRender field={field} ref={ref} />
  }
)

TextField.displayName = 'TextField'
