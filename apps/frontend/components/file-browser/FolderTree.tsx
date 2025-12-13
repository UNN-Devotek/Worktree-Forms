'use client'

import React from 'react'
import { useFileSystemStore } from '@/lib/stores/file-system-store'
import { Folder } from '@/types/file-system'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolder, faFolderOpen, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { useDroppable } from '@dnd-kit/core'

interface FolderTreeProps {
  className?: string
}

export function FolderTree({ className }: FolderTreeProps) {
  const { items, currentFolderId, expandedFolders, toggleFolder, setCurrentFolder } = useFileSystemStore()

  // Build tree structure
  const getSubFolders = (parentId: string | null) => {
    return items
      .filter(item => item.type === 'folder' && item.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name)) as Folder[]
  }

  const renderFolder = (folder: Folder, depth: number = 0) => {
    return (
      <FolderItem 
         key={folder.id} 
         folder={folder} 
         depth={depth}
         isExpanded={expandedFolders.includes(folder.id)}
         isSelected={currentFolderId === folder.id}
         hasChildren={getSubFolders(folder.id).length > 0}
         onNavigate={setCurrentFolder}
         onToggle={toggleFolder}
      >
         {expandedFolders.includes(folder.id) && (
            <div>
              {getSubFolders(folder.id).map(child => renderFolder(child, depth + 1))}
            </div>
          )}
      </FolderItem>
    )
  }

  const rootFolders = getSubFolders(null)

  return (
    <div className={cn("py-2", className)}>
       <DroppableAllForms 
          isSelected={currentFolderId === null} 
          onClick={() => setCurrentFolder(null)} 
       />
      
      {rootFolders.map(folder => renderFolder(folder))}
    </div>
  )
}

function DroppableAllForms({ isSelected, onClick }: { isSelected: boolean, onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root', // ID for root/all
    data: { type: 'folder', id: null }
  })

  return (
    <div 
        ref={setNodeRef}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm text-sm mb-1 transition-colors",
          isSelected && "bg-accent font-medium text-accent-foreground",
          !isSelected && "hover:bg-accent/50",
          isOver && "bg-primary/20 ring-1 ring-primary"
        )}
        onClick={onClick}
      >
        <div className="w-4" /> {/* Spacer for chevron */}
        <FontAwesomeIcon icon={faFolderOpen} className="h-4 w-4 text-gray-900 dark:text-white" />
        <span className="text-gray-900 dark:text-white">All Forms</span>
      </div>
  )
}

interface FolderItemProps {
  folder: Folder
  depth: number
  isExpanded: boolean
  isSelected: boolean
  hasChildren: boolean
  onNavigate: (id: string) => void
  onToggle: (id: string) => void
  children?: React.ReactNode
}

function FolderItem({ folder, depth, isExpanded, isSelected, hasChildren, onNavigate, onToggle, children }: FolderItemProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: folder
  })

  return (
    <div>
        <div 
          ref={setNodeRef}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm text-sm transition-colors",
            isSelected && "bg-accent font-medium text-accent-foreground",
            !isSelected && "hover:bg-accent/50",
            isOver && "bg-primary/20 ring-1 ring-primary"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onNavigate(folder.id)}
        >
          {/* Expand Toggle */}
          <div 
            className="h-4 w-4 flex items-center justify-center shrink-0 hover:text-foreground/80"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(folder.id)
            }}
          >
            {hasChildren && (
              <FontAwesomeIcon 
                icon={isExpanded ? faChevronDown : faChevronRight} 
                className="h-2.5 w-2.5 text-muted-foreground" 
              />
            )}
          </div>

          {/* Folder Icon */}
          <FontAwesomeIcon 
            icon={isExpanded ? faFolderOpen : faFolder} 
            className="h-4 w-4 text-gray-900 dark:text-white"
          />

          {/* Name */}
          <span className="truncate text-gray-900 dark:text-white">{folder.name}</span>
        </div>

        {/* Children */}
        {children}
      </div>
  )
}
