'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useProjectFileSystemStore } from '@/lib/stores/project-file-system-store'
import { FileSystemItem } from '@/types/file-system'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolder, faFileAlt, faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface ProjectItemListProps {
  onNavigate: (folderId: string) => void
  projectSlug: string
}

export function ProjectItemList({ onNavigate, projectSlug }: ProjectItemListProps) {
  const { items, currentFolderId } = useProjectFileSystemStore()

  const currentItems = items.filter((item) => item.parentId === currentFolderId)

  const sortedItems = [...currentItems].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'folder' ? -1 : 1
  })

  if (sortedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FontAwesomeIcon icon={faFolder} className="h-16 w-16 mb-4 opacity-20" />
        <p>No forms yet. Create your first form to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedItems.map((item) => (
        <ProjectFileItem
          key={item.id}
          item={item}
          onNavigate={onNavigate}
          projectSlug={projectSlug}
        />
      ))}
    </div>
  )
}

function ProjectFileItem({
  item,
  onNavigate,
  projectSlug,
}: {
  item: FileSystemItem
  onNavigate: (id: string) => void
  projectSlug: string
}) {
  const router = useRouter()
  const isFolder = item.type === 'folder'

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = () => {
    if (isFolder) {
      onNavigate(item.id)
    } else if ((item as any).formSlug) {
      router.push(`/project/${projectSlug}/forms/${(item as any).formSlug}`)
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          'cursor-pointer hover:border-primary/50 transition-colors group',
          isFolder ? 'bg-muted/10' : 'bg-card'
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4 flex items-start gap-4">
          {/* Drag handle — only the icon area initiates drag, keeping the card clickable */}
          <div
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'h-10 w-10 shrink-0 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing',
              isFolder
                ? 'bg-amber-100 text-amber-500 dark:bg-amber-900/20'
                : 'bg-blue-100 text-blue-500 dark:bg-blue-900/20'
            )}
          >
            <FontAwesomeIcon icon={isFolder ? faFolder : faFileAlt} className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate leading-none mb-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
            </p>
            {!isFolder && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                  Draft
                </span>
              </div>
            )}
          </div>

          <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`Open actions for ${item.name}`}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
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
