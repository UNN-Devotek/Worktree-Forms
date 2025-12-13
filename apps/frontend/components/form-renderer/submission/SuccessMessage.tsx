'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SuccessMessageProps {
  message?: string
  onReset?: () => void
  showResetButton?: boolean
}

export function SuccessMessage({
  message = 'Thank you! Your form has been submitted successfully.',
  onReset,
  showResetButton = false
}: SuccessMessageProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Submission Successful!</h2>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">{message}</p>

        {showResetButton && onReset && (
          <Button onClick={onReset} variant="outline">
            Submit Another Response
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
