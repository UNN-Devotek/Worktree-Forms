'use client'

import { forwardRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'

interface TextAreaFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

const TextAreaFieldRender = forwardRef<HTMLTextAreaElement, { field: FormFieldBase }>(
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
        <Textarea
          {...formField}
          ref={formRef}
          id={field.id}
          placeholder={field.placeholder}
          rows={field.rows || 4}
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

TextAreaFieldRender.displayName = 'TextAreaFieldRender'

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
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
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            disabled
            className="cursor-not-allowed resize-none"
          />
        </FieldWrapper>
      )
    }

    // Preview mode: enabled textarea without form context
    if (mode === 'preview') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            maxLength={field.maxLength}
            ref={ref}
          />
        </FieldWrapper>
      )
    }

    return <TextAreaFieldRender field={field} ref={ref} />
  }
)

TextAreaField.displayName = 'TextAreaField'
