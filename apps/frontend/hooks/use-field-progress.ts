'use client'

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormSchema } from '@/types/group-forms'

interface FieldProgressResult {
  completedCount: number
  totalRequired: number
  percentage: number
  isComplete: boolean
}

// Type definitions for both schema formats
interface SurveyJSElement {
  name: string
  isRequired?: boolean
  required?: boolean
}

interface SurveyJSPage {
  elements?: SurveyJSElement[]
}

interface V2Section {
  fields?: {
    name: string
    required?: boolean
    isRequired?: boolean
  }[]
}

interface V2Page {
  sections?: V2Section[]
}

type FormPage = V2Page & SurveyJSPage

/**
 * Extract required field names from form schema.
 * Handles both v2.0 format (pages.sections.fields) and SurveyJS format (pages.elements)
 */
function extractRequiredFieldNames(formSchema: FormSchema): string[] {
  const requiredFields: string[] = []
  const pages = (formSchema?.pages || []) as FormPage[]

  pages.forEach(page => {
    // v2.0 format: sections with fields
    const sections = page.sections || []
    sections.forEach((section) => {
      const fields = section?.fields || []
      fields.forEach((field) => {
        if ((field?.required || field?.isRequired) && field?.name) {
          requiredFields.push(field.name)
        }
      })
    })

    // SurveyJS format: elements directly on page
    const elements = page.elements || []
    elements.forEach((element) => {
      if ((element?.isRequired || element?.required) && element?.name) {
        requiredFields.push(element.name)
      }
    })
  })

  return requiredFields
}

/**
 * Hook to track required field completion progress in a form.
 * Only counts fields marked as required.
 *
 * @param formSchema - The form schema containing pages, sections, and fields
 * @returns Progress information including completed count, total, and percentage
 */
export function useFieldProgress(formSchema: FormSchema): FieldProgressResult {
  const { watch } = useFormContext()
  const formValues = watch()

  return useMemo(() => {
    const requiredFields = extractRequiredFieldNames(formSchema)
    const totalRequired = requiredFields.length

    // If no required fields, return 100% complete
    if (totalRequired === 0) {
      return {
        completedCount: 0,
        totalRequired: 0,
        percentage: 100,
        isComplete: true
      }
    }

    // Count completed fields (non-empty values)
    const completedCount = requiredFields.filter(fieldName => {
      const value = formValues[fieldName]

      // Check for empty values based on type
      if (value === undefined || value === null) return false
      if (value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && Object.keys(value).length === 0) return false

      return true
    }).length

    const percentage = Math.round((completedCount / totalRequired) * 100)

    return {
      completedCount,
      totalRequired,
      percentage,
      isComplete: completedCount === totalRequired
    }
  }, [formSchema, formValues])
}

/**
 * Standalone function to calculate field progress without react-hook-form context.
 * Useful for preview mode or when form values are passed directly.
 *
 * @param formSchema - The form schema
 * @param formValues - Object containing field values
 * @returns Progress information
 */
export function calculateFieldProgress(
  formSchema: FormSchema,
  formValues: Record<string, unknown>
): FieldProgressResult {
  const requiredFields = extractRequiredFieldNames(formSchema)
  const totalRequired = requiredFields.length

  if (totalRequired === 0) {
    return {
      completedCount: 0,
      totalRequired: 0,
      percentage: 100,
      isComplete: true
    }
  }

  const completedCount = requiredFields.filter(fieldName => {
    const value = formValues[fieldName]
    if (value === undefined || value === null) return false
    if (value === '') return false
    if (Array.isArray(value) && value.length === 0) return false
    if (typeof value === 'object' && Object.keys(value).length === 0) return false
    return true
  }).length

  const percentage = Math.round((completedCount / totalRequired) * 100)

  return {
    completedCount,
    totalRequired,
    percentage,
    isComplete: completedCount === totalRequired
  }
}
