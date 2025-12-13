'use client'

import { Progress } from '@/components/ui/progress'

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">
          Step {current} of {total}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
