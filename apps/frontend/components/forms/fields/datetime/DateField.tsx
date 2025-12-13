'use client'

import { forwardRef, useState, useEffect } from 'react' // Added useEffect here
import { useFormContext } from 'react-hook-form'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'
import { cn } from '@/lib/utils'

interface DateFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

// --- Render Component with Context ---
const DateFieldRender = forwardRef<HTMLInputElement, { field: FormFieldBase, mode?: 'render' | 'preview' }>(
  ({ field, mode = 'render' }, _ref) => { // Removed ref parameter for now
    const form = useFormContext()
    const error = mode === 'render' && form ? form.formState.errors[field.name]?.message as string : undefined
    const initialValue = mode === 'render' && form ? form.watch(field.name) : undefined

    const [date, setDate] = useState<Date | undefined>(
      initialValue ? new Date(initialValue) : undefined
    )

    useEffect(() => {
      if (mode === 'render' && form) {
        form.register(field.name)
      }
    }, [field.name, form, mode]);

    const commonFieldContent = (
      <FieldWrapper
        id={field.id}
        label={field.label}
        helpText={field.helpText}
        error={error}
        required={field.required}
        colSpan={field.colSpan}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
              disabled={mode === 'preview'} // Disable popover trigger in preview if desired, or allow it but no save
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          {mode !== 'preview' && ( // Disable calendar interaction in preview mode? Or allow local state?
           // If we allow interaction in preview, we just update local state.
           // But popover content might be tricky in dnd context. Let's stick to disabling for now or allow local.
           // Allowing local state for preview is better UX.
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate: Date | undefined) => {
                  setDate(selectedDate)
                  if (mode === 'render' && form) {
                      if (selectedDate) {
                        form.setValue(field.name, selectedDate.toISOString())
                      } else {
                        form.setValue(field.name, null)
                      }
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          )}
          {mode === 'preview' && (
             <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate: Date | undefined) => {
                  setDate(selectedDate)
                }}
                initialFocus
              />
            </PopoverContent>
          )}
        </Popover>
      </FieldWrapper>
    )

    return commonFieldContent
  }
)
DateFieldRender.displayName = 'DateFieldRender'

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ field, mode = 'render' }, ref) => { // Removed ref usage in render for now

    if (mode === 'builder') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-70">
            <span>Select a date</span>
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </div>
        </FieldWrapper>
      )
    }

    // Render and Preview modes
    return <DateFieldRender field={field} mode={mode} ref={ref} />
  }
)
DateField.displayName = 'DateField'