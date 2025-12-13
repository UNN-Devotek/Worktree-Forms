'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SubmitButton } from '../submission/SubmitButton'

interface PageNavigationProps {
  isFirstPage: boolean
  isLastPage: boolean
  isSubmitting: boolean
  onNext: () => void
  onBack: () => void
  nextButtonText?: string
  backButtonText?: string
  submitButtonText?: string
}

export function PageNavigation({
  isFirstPage,
  isLastPage,
  isSubmitting,
  onNext,
  onBack,
  nextButtonText = 'Next',
  backButtonText = 'Back',
  submitButtonText = 'Submit'
}: PageNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {!isFirstPage && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {backButtonText}
          </Button>
        )}
      </div>

      <div>
        {isLastPage ? (
          <SubmitButton
            isSubmitting={isSubmitting}
            text={submitButtonText}
          />
        ) : (
          <Button
            type="button"
            onClick={onNext}
          >
            {nextButtonText}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
