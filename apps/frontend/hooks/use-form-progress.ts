'use client'

import { useFormContext } from 'react-hook-form'
import { useMemo } from 'react'
import { FormSchema } from '@/types/group-forms'

export function useFormProgress(formSchema: FormSchema, currentPageIndex: number) {
  const { formState } = useFormContext()

  const progress = useMemo(() => {
    const totalPages = formSchema.pages.length
    return {
      current: currentPageIndex + 1,
      total: totalPages,
      percentage: ((currentPageIndex + 1) / totalPages) * 100,
      isComplete: currentPageIndex === totalPages - 1
    }
  }, [formSchema.pages.length, currentPageIndex])

  const isPageValid = useMemo(() => {
    const currentPage = formSchema.pages[currentPageIndex]
    const pageFieldNames = currentPage.sections.flatMap(section =>
      section.fields.map(field => field.name)
    )

    // Check if all required fields on current page are filled
    return pageFieldNames.every(fieldName => {
      const fieldError = formState.errors[fieldName]
      return !fieldError
    })
  }, [formSchema.pages, currentPageIndex, formState.errors])

  return {
    progress,
    isPageValid
  }
}