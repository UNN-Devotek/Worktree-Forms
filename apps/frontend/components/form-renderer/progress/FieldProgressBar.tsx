'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

interface FieldProgressBarProps {
  completedCount: number
  totalRequired: number
  percentage: number
  className?: string
}

/**
 * Compact progress bar showing required field completion.
 * Designed to be placed next to the submit button at the bottom of forms.
 */
export function FieldProgressBar({
  completedCount,
  totalRequired,
  percentage,
  className
}: FieldProgressBarProps) {
  // Don't show if there are no required fields
  if (totalRequired === 0) {
    return null
  }

  const isComplete = completedCount === totalRequired

  return (
    <div className={cn('flex items-center gap-3 flex-1 min-w-0', className)}>
      <Progress
        value={percentage}
        className={cn(
          'h-2 flex-1',
          isComplete && '[&>div]:bg-green-500'
        )}
      />
      <div className="flex items-center gap-1.5 shrink-0">
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : null}
        <span className={cn(
          'text-sm whitespace-nowrap',
          isComplete ? 'text-green-600 font-medium' : 'text-muted-foreground'
        )}>
          {completedCount}/{totalRequired} required
        </span>
      </div>
    </div>
  )
}
