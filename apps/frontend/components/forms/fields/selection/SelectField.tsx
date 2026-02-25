'use client'

import { forwardRef } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'

interface SelectFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

const SelectFieldRender = forwardRef<HTMLButtonElement, { field: FormFieldBase }>(
  ({ field }, ref) => {
    const form = useFormContext()
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
        <Controller
          name={field.name}
          control={form.control}
          render={({ field: controllerField }) => (
            <Select
              onValueChange={(value) => {
                controllerField.onChange(value)
                form.trigger(field.name) // Trigger validation
              }}
              value={controllerField.value}
            >
              <SelectTrigger
                id={field.id}
                aria-invalid={!!error}
                aria-describedby={
                  error
                    ? `${field.id}-error`
                    : field.helpText
                    ? `${field.id}-help`
                    : undefined
                }
                ref={ref}
              >
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.choices?.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FieldWrapper>
    )
  }
)

SelectFieldRender.displayName = 'SelectFieldRender'

export const SelectField = forwardRef<HTMLButtonElement, SelectFieldProps>(
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
          <Select disabled>
            <SelectTrigger className="cursor-not-allowed">
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
          </Select>
        </FieldWrapper>
      )
    }

    // Preview mode: enabled select without form context
    if (mode === 'preview') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <Select>
            <SelectTrigger id={field.id} ref={ref}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.choices?.map((choice) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {choice.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      )
    }

    return <SelectFieldRender field={field} ref={ref} />
  }
)

SelectField.displayName = 'SelectField'
