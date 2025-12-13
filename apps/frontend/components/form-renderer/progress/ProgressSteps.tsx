'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressStepsProps {
  steps: string[]
  currentStep: number
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={index} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  !isCompleted && !isCurrent && 'border-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className="mt-2 text-xs font-medium text-center max-w-[100px]">
                {step}
              </span>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 transition-colors',
                  isCompleted ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
