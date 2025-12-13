'use client'

import { forwardRef, useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

const RatingFieldRender = forwardRef<HTMLDivElement, { field: FormFieldBase }>(
  ({ field }, ref) => {
    const form = useFormContext()
    const error = form.formState.errors[field.name]?.message as string

    // Register field with form on mount/unmount
    useEffect(() => {
      form.register(field.name)
      return () => {
        form.unregister(field.name)
      }
    }, [form, field.name])

    // Get current value from form
    const currentValue = form.watch(field.name) || 0
    const [rating, setRating] = useState(currentValue)
    const [hoverRating, setHoverRating] = useState(0)

    // Sync local state with form value
    useEffect(() => {
      setRating(currentValue)
    }, [currentValue])

    const maxRating = field.ratingMax || 5

    const handleClick = (value: number) => {
      setRating(value)
      form.setValue(field.name, value, { shouldValidate: true, shouldDirty: true })
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
          className="flex gap-1"
          role="radiogroup"
          aria-label={field.label}
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
          {Array.from({ length: maxRating }).map((_, index) => {
            const value = index + 1
            const isFilled = value <= (hoverRating || rating)

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleClick(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none focus:ring-2 focus:ring-primary rounded transition-transform hover:scale-110"
                aria-label={`Rate ${value} out of ${maxRating}`}
                role="radio"
                aria-checked={rating === value}
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-all duration-200',
                    isFilled
                      ? 'fill-primary text-primary scale-110'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                />
              </button>
            )
          })}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {rating} out of {maxRating} stars
          </p>
        )}
      </FieldWrapper>
    )
  }
)

RatingFieldRender.displayName = 'RatingFieldRender'

export const RatingField = forwardRef<HTMLDivElement, RatingFieldProps>(
  ({ field, mode = 'render' }, ref) => {
    const maxRating = field.ratingMax || 5
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)

    if (mode === 'builder') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <div className="flex gap-1">
            {Array.from({ length: maxRating }).map((_, index) => (
              <Star
                key={index}
                className="h-8 w-8 text-muted-foreground cursor-not-allowed"
              />
            ))}
          </div>
        </FieldWrapper>
      )
    }

    // Preview mode: enabled rating without form context
    if (mode === 'preview') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <div className="flex gap-1" ref={ref}>
            {Array.from({ length: maxRating }).map((_, index) => {
              const value = index + 1
              const isFilled = value <= (hoverRating || rating)

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none focus:ring-2 focus:ring-primary rounded transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-all duration-200',
                      isFilled
                        ? 'fill-primary text-primary scale-110'
                        : 'text-muted-foreground hover:text-primary'
                    )}
                  />
                </button>
              )
            })}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {rating} out of {maxRating} stars
            </p>
          )}
        </FieldWrapper>
      )
    }

    return <RatingFieldRender field={field} ref={ref} />
  }
)

RatingField.displayName = 'RatingField'
