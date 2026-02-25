'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { useProjectFileSystemStore } from '@/lib/stores/project-file-system-store'
import { ProjectFolderTree } from './ProjectFolderTree'
import { ProjectItemList } from './ProjectItemList'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, FolderPlus, Loader2 } from 'lucide-react'

interface ProjectFormBrowserProps {
  projectId: string
  projectSlug: string
}

export function ProjectFormBrowser({ projectId, projectSlug }: ProjectFormBrowserProps) {
  const router = useRouter()
  const { initialize, isLoading, hasFolders, currentFolderId, setCurrentFolder, createFolder } =
    useProjectFileSystemStore()

  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  useEffect(() => {
    initialize(projectId)
  }, [projectId, initialize])

  const handleNavigate = (folderId: string) => {
    setCurrentFolder(folderId)
  }

  const handleNewForm = () => {
    const url = `/project/${projectSlug}/forms/new${currentFolderId ? `?folderId=${currentFolderId.replace('folder-', '')}` : ''}`
    router.push(url)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    setIsCreatingFolder(true)
    try {
      await createFolder(newFolderName.trim(), currentFolderId, projectId)
      setNewFolderName('')
      setNewFolderDialogOpen(false)
    } finally {
      setIsCreatingFolder(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Forms</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setNewFolderDialogOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button size="sm" onClick={handleNewForm}>
            <Plus className="h-4 w-4 mr-2" />
            New Form
          </Button>
        </div>
      </div>

      <DndContext collisionDetection={closestCenter}>
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Folder sidebar — only shown when folders exist */}
          {hasFolders && (
            <aside className="w-56 shrink-0 border-r pr-4 overflow-y-auto">
              <ProjectFolderTree />
            </aside>
          )}

          {/* Form grid */}
          <div className={`flex-1 overflow-y-auto ${hasFolders ? '' : 'w-full'}`}>
            <ProjectItemList onNavigate={handleNavigate} projectSlug={projectSlug} />
          </div>
        </div>

        <DragOverlay>
          <div className="bg-card border rounded-lg p-4 shadow-lg opacity-80 text-sm">
            Moving...
          </div>
        </DragOverlay>
      </DndContext>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()}>
              {isCreatingFolder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Folder'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
