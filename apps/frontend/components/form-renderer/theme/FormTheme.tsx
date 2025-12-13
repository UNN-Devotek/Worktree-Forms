'use client'

import type { ReactNode, CSSProperties } from 'react'
import { FormThemeConfig } from '@/types/group-forms'

interface FormThemeProps {
  theme: FormThemeConfig
  children: ReactNode
}

export function FormTheme({ theme, children }: FormThemeProps) {
  // For now, we'll just pass through the children
  // In the future, we can apply custom CSS variables based on the theme config
  return (
    <div
      className="form-theme-wrapper"
      style={{
        ...(theme.primary_color && { '--form-primary': theme.primary_color }),
        ...(theme.secondary_color && { '--form-secondary': theme.secondary_color }),
        ...(theme.background_color && { '--form-background': theme.background_color }),
        ...(theme.text_color && { '--form-text': theme.text_color })
      } as CSSProperties}
    >
      {children}
    </div>
  )
}
