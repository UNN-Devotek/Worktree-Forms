'use client'

import { useState } from 'react'
import { Plus, GripVertical, X, Pencil, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function PageTabs() {
  const {
    formSchema,
    currentPageIndex,
    setCurrentPage,
    addPage,
    removePage,
    updatePage
  } = useFormBuilderStore()

  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)

  const pages = formSchema?.pages || []

  const handleStartEdit = (pageId: string, currentTitle: string) => {
    setEditingPageId(pageId)
    setEditValue(currentTitle)
  }

  const handleSaveEdit = (pageIndex: number) => {
    if (editValue.trim()) {
      updatePage(pageIndex, { title: editValue.trim() })
    }
    setEditingPageId(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, pageIndex: number) => {
    if (e.key === 'Enter') {
      handleSaveEdit(pageIndex)
    } else if (e.key === 'Escape') {
      setEditingPageId(null)
      setEditValue('')
    }
  }

  const handleDeleteClick = (pageIndex: number) => {
    const page = pages[pageIndex]
    const hasFields = page.sections.some(s => s.fields.length > 0)

    if (hasFields) {
      setDeleteConfirmIndex(pageIndex)
    } else {
      removePage(pageIndex)
    }
  }

  const confirmDelete = () => {
    if (deleteConfirmIndex !== null) {
      removePage(deleteConfirmIndex)
      setDeleteConfirmIndex(null)
    }
  }

  if (pages.length <= 1) {
    // Single page - show minimal UI with just "Add Page" button
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground">Single Page Form</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={addPage}
                className="h-7 px-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Page
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Convert to multi-page form</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1 px-4 py-2 border-b bg-muted/30 overflow-x-auto">
        {pages.map((page, index) => {
          const isActive = index === currentPageIndex
          const isEditing = editingPageId === page.id

          return (
            <div
              key={page.id}
              className={cn(
                'group flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
                'border border-transparent',
                isActive
                  ? 'bg-background border-border shadow-sm'
                  : 'hover:bg-background/50 cursor-pointer'
              )}
              onClick={() => !isEditing && setCurrentPage(index)}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab" />

              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onBlur={() => handleSaveEdit(index)}
                    className="h-6 w-32 text-sm px-2"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSaveEdit(index)
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className={cn(
                    'truncate max-w-32',
                    isActive ? 'font-medium' : 'text-muted-foreground'
                  )}>
                    {page.title || `Page ${index + 1}`}
                  </span>

                  {/* Edit button - show on hover */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartEdit(page.id, page.title || `Page ${index + 1}`)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>

                  {/* Delete button - show on hover, only if more than 1 page */}
                  {pages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(index)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )
        })}

        {/* Add Page Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={addPage}
                className="h-8 w-8 ml-1"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new page</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmIndex !== null} onOpenChange={() => setDeleteConfirmIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page?</AlertDialogTitle>
            <AlertDialogDescription>
              This page contains fields. Are you sure you want to delete it? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
