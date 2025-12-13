'use client'

import { forwardRef, useMemo } from 'react'
import { FormFieldBase } from '@/types/group-forms'
import { cn } from '@/lib/utils'

interface TextElementProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

// Simple markdown-to-HTML converter for basic formatting
function parseMarkdown(text: string): string {
  if (!text) return ''

  return text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br />')
}

// Check if content is the old HTML default or empty
function isEmptyOrDefault(content: string | undefined): boolean {
  if (!content) return true
  const trimmed = content.trim()
  return (
    trimmed === '' ||
    trimmed === '<p>Enter your text here...</p>' ||
    trimmed === 'Enter your text here...'
  )
}

export const TextElement = forwardRef<HTMLDivElement, TextElementProps>(
  ({ field, mode = 'render' }, ref) => {
    // Parse markdown content
    const parsedContent = useMemo(() => {
      if (isEmptyOrDefault(field.content)) return ''
      return parseMarkdown(field.content || '')
    }, [field.content])

    // Builder mode: Show content or placeholder
    if (mode === 'builder') {
      if (isEmptyOrDefault(field.content)) {
        return (
          <div
            ref={ref}
            className={cn(
              'p-3 rounded-md border border-dashed border-border',
              'min-h-[60px] flex items-center justify-center',
              'text-muted-foreground text-sm'
            )}
          >
            Click to add text content...
          </div>
        )
      }

      return (
        <div
          ref={ref}
          className={cn(
            'prose prose-sm dark:prose-invert max-w-none',
            '[&_a]:text-primary [&_a]:underline'
          )}
          dangerouslySetInnerHTML={{ __html: parsedContent }}
        />
      )
    }

    // Render/Preview: Display the parsed markdown content
    if (isEmptyOrDefault(field.content)) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none',
          '[&_a]:text-primary [&_a]:underline'
        )}
        dangerouslySetInnerHTML={{ __html: parsedContent }}
      />
    )
  }
)

TextElement.displayName = 'TextElement'
