'use client'

import React from 'react'
import { useFileSystemStore } from '@/lib/stores/file-system-store'
import { FileSystemItem } from '@/types/file-system'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolder, faFileAlt, faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface ItemListProps {
  onNavigate: (folderId: string) => void
}

export function ItemList({ onNavigate }: ItemListProps) {
  const { items, currentFolderId } = useFileSystemStore()

  const currentItems = items.filter(item => item.parentId === currentFolderId)
  
  // Sort: Folders first, then forms
  const sortedItems = [...currentItems].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'folder' ? -1 : 1
  })

  // Group by type for some separation if needed, but linear list is fine too
  
  if (sortedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FontAwesomeIcon icon={faFolder} className="h-16 w-16 mb-4 opacity-20" />
        <p>This folder is empty</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedItems.map(item => (
        <FileItem key={item.id} item={item} onNavigate={onNavigate} />
      ))}
    </div>
  )
}

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

function FileItem({ item, onNavigate }: { item: FileSystemItem, onNavigate: (id: string) => void }) {
  const isFolder = item.type === 'folder'
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
    <Card 
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-colors group",
        isFolder ? "bg-muted/10" : "bg-card"
      )}
      onClick={() => {
        if (isFolder) {
            onNavigate(item.id)
        } else if ((item as any).formSlug) {
            // It's a form from the backend -> Go to Landing Page
            window.location.href = `/forms/${(item as any).formSlug}`
        }
      }}
    >
      <CardContent className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center",
          isFolder ? "bg-amber-100 text-amber-500 dark:bg-amber-900/20" : "bg-blue-100 text-blue-500 dark:bg-blue-900/20"
        )}>
          <FontAwesomeIcon icon={isFolder ? faFolder : faFileAlt} className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate leading-none mb-1">{item.name}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
          </p>
          {!isFolder && (
            <div className="mt-2 flex items-center gap-2">
               {/* Could show status badge here */}
               <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                  Draft
               </span>
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <FontAwesomeIcon icon={faEllipsisV} className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Move</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
