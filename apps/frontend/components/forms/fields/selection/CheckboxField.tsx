'use client'

import { forwardRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'

interface CheckboxFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

const CheckboxFieldRender = forwardRef<HTMLDivElement, { field: FormFieldBase }>(
  ({ field }, ref) => {
    const form = useFormContext()
    const error = form.formState.errors[field.name]?.message as string
    const [selectedValues, setSelectedValues] = useState<string[]>([])

    // Register field with form (for validation and value tracking)
    form.register(field.name)

    const handleCheckboxChange = (choiceValue: string, checked: boolean) => {
      let newValues: string[]

      if (checked) {
        newValues = [...selectedValues, choiceValue]
      } else {
        newValues = selectedValues.filter(v => v !== choiceValue)
      }

      setSelectedValues(newValues)
      form.setValue(field.name, newValues)
    }

    return (
      <FieldWrapper
        id={field.id}
        label={field.label}
        helpText={field.helpText}
        error={error}
        required={field.required}
        colSpan={field.colSpan}
      >
        <div
          className="space-y-2"
          role="group"
          aria-labelledby={field.id}
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
          {field.choices?.map((choice) => (
            <div key={choice.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${field.id}-${choice.value}`}
                checked={selectedValues.includes(choice.value)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(choice.value, checked as boolean)
                }
              />
              <Label
                htmlFor={`${field.id}-${choice.value}`}
                className="cursor-pointer"
              >
                {choice.text}
              </Label>
            </div>
          ))}
        </div>
      </FieldWrapper>
    )
  }
)

CheckboxFieldRender.displayName = 'CheckboxFieldRender'

export const CheckboxField = forwardRef<HTMLDivElement, CheckboxFieldProps>(
  ({ field, mode = 'render' }, ref) => {
    const [selectedValues, setSelectedValues] = useState<string[]>([])

    if (mode === 'builder') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <div className="space-y-2">
            {field.choices?.map((choice, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${choice.value}`}
                  disabled
                />
                <Label
                  htmlFor={`${field.id}-${choice.value}`}
                  className="cursor-not-allowed opacity-70"
                >
                  {choice.text}
                </Label>
              </div>
            ))}
          </div>
        </FieldWrapper>
      )
    }

    // Preview mode: enabled checkboxes without form context
    if (mode === 'preview') {
      const handleCheckboxChange = (choiceValue: string, checked: boolean) => {
        if (checked) {
          setSelectedValues([...selectedValues, choiceValue])
        } else {
          setSelectedValues(selectedValues.filter(v => v !== choiceValue))
        }
      }

      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <div className="space-y-2" ref={ref}>
            {field.choices?.map((choice) => (
              <div key={choice.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${choice.value}`}
                  checked={selectedValues.includes(choice.value)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(choice.value, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`${field.id}-${choice.value}`}
                  className="cursor-pointer"
                >
                  {choice.text}
                </Label>
              </div>
            ))}
          </div>
        </FieldWrapper>
      )
    }

    return <CheckboxFieldRender field={field} ref={ref} />
  }
)

CheckboxField.displayName = 'CheckboxField'
