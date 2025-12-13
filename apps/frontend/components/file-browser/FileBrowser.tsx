'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { FolderTree } from './FolderTree'
import { ItemList } from './ItemList'
import { useFileSystemStore } from '@/lib/stores/file-system-store'
import { Button } from '@/components/ui/button'
import { Plus, FolderPlus } from 'lucide-react'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog' 
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function FileBrowser() {
  const { initialize, currentFolderId, createFolder, setCurrentFolder, moveItem } = useFileSystemStore()
  const [newFolderOpen, setNewFolderOpen] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState('')

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFolderName.trim()) {
      createFolder(newFolderName, currentFolderId)
      setNewFolderName('')
      setNewFolderOpen(false)
    }
  }
  
  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const [activeId, setActiveId] = React.useState<string | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
       // If dropped on 'root', move to null parent
       const targetFolderId = over.id === 'root' ? null : (over.id as string)
       
       // Move the item
       moveItem(active.id as string, targetFolderId)
       
       // Optional: Navigate to target folder to show user the result? 
       // setCurrentFolder(targetFolderId)
    }
    setActiveId(null)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex h-[calc(100vh-10rem)] border rounded-lg overflow-hidden bg-background">
        {/* Sidebar - Folder Tree */}
        <div className="w-64 border-r bg-muted/10 overflow-y-auto">
            <div className="h-14 border-b bg-card flex items-center px-4">
              <h2 className="font-semibold text-sm">Folders</h2>
            </div>
            <FolderTree className="p-2" />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-card">
            {/* Toolbar */}
            <div className="h-14 border-b flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {/* Breadcrumbs could go here */}
                <span>File Browser</span>
            </div>
            
            <div className="flex items-center gap-2">
                <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" className="gap-2">
                        <FolderPlus className="h-4 w-4" />
                        New Folder
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Folder</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateFolder} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Folder Name</Label>
                                <Input 
                                id="name" 
                                value={newFolderName} 
                                onChange={e => setNewFolderName(e.target.value)}
                                placeholder="e.g., Marketing"
                                autoFocus
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit">Create</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
                
                <Link href="/forms/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Form
                    </Button>
                </Link>
            </div>
            </div>

            {/* File Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/5">
                <ItemList onNavigate={setCurrentFolder} />
            </div>
        </div>
        </div>
        
        <DragOverlay>
           {activeId ? (
              <div className="px-4 py-2 bg-background border rounded shadow-lg opacity-80 cursor-grabbing">
                 Moving Item...
              </div>
           ) : null}
        </DragOverlay>
    </DndContext>
  )
}
