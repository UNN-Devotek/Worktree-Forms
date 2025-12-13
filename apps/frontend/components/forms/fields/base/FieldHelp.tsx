'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldHelpProps {
  id: string
  children: ReactNode
  className?: string
}

export function FieldHelp({ id, children, className }: FieldHelpProps) {
  return (
    <p
      id={id}
      className={cn(
        'mt-2 text-sm text-muted-foreground',
        className
      )}
    >
      {children}
    </p>
  )
}
