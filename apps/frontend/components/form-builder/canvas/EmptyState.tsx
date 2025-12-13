'use client'

import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'

export function EmptyState() {
  const { addSection, currentPageIndex } = useFormBuilderStore()

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-12 border-2 border-dashed rounded-lg">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Start Building Your Form</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        Drag and drop fields from the left panel to create your form.
        You can also click &ldquo;Add Section&rdquo; to organize your fields.
      </p>
      <Button onClick={() => addSection(currentPageIndex)} variant="default">
        Add Your First Section
      </Button>
    </div>
  )
}
