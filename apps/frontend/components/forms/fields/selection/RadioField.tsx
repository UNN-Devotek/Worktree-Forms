'use client'

import { forwardRef } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'

interface RadioFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

export const RadioField = forwardRef<HTMLDivElement, RadioFieldProps>(
  ({ field, mode = 'render' }, ref) => {
    const form = useFormContext()
    const error = form.formState.errors[field.name]?.message as string

    // Builder mode
    if (mode === 'builder') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <RadioGroup disabled>
            {(field.choices || []).map((choice, index) => (
              <div key={`${choice.value}-${index}`} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={choice.value || `option-${index}`}
                  id={`${field.id}-${choice.value || index}`}
                  disabled
                />
                <Label
                  htmlFor={`${field.id}-${choice.value || index}`}
                  className="cursor-not-allowed opacity-70"
                >
                  {choice.text || `Option ${index + 1}`}
                </Label>
              </div>
            ))}
            {(!field.choices || field.choices.length === 0) && (
              <div className="text-sm text-muted-foreground italic p-2 border border-dashed rounded">
                No options defined
              </div>
            )}
          </RadioGroup>
        </FieldWrapper>
      )
    }

    // Render and Preview modes
    return (
      <FieldWrapper
        id={field.id}
        label={field.label}
        helpText={field.helpText}
        error={mode === 'render' ? error : undefined} // Only show errors in render mode
        required={field.required}
        colSpan={field.colSpan}
      >
        <Controller
          name={field.name}
          control={form.control}
          render={({ field: controllerField }) => (
            <RadioGroup
              onValueChange={(value) => {
                controllerField.onChange(value)
                if (mode === 'render') {
                  form.trigger(field.name) // Trigger validation only in render mode
                }
              }}
              value={controllerField.value}
              defaultValue={controllerField.value}
              aria-invalid={mode === 'render' ? !!error : undefined}
              aria-describedby={
                mode === 'render' && error
                  ? `${field.id}-error`
                  : field.helpText
                  ? `${field.id}-help`
                  : undefined
              }
              ref={ref} // Pass ref to the RadioGroup
              disabled={mode === 'preview'} // Disable interaction in preview
            >
              {field.choices?.map((choice) => (
                <div key={choice.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={choice.value}
                    id={`${field.id}-${choice.value}`}
                    disabled={mode === 'preview'}
                  />
                  <Label
                    htmlFor={`${field.id}-${choice.value}`}
                    className="cursor-pointer"
                  >
                    {choice.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      </FieldWrapper>
    )
  }
)

RadioField.displayName = 'RadioField'