'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps {
  isSubmitting: boolean
  text?: string
  className?: string
}

export function SubmitButton({
  isSubmitting,
  text = 'Submit',
  className
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className={className}
      size="lg"
    >
      {isSubmitting && (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      )}
      {isSubmitting ? 'Submitting...' : text}
    </Button>
  )
}
