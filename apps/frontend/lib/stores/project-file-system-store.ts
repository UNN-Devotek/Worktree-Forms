import { create } from 'zustand'
import { FileSystemItem } from '@/types/file-system'
import { apiClient } from '@/lib/api'

interface ProjectFileSystemStore {
  items: FileSystemItem[]
  currentFolderId: string | null
  expandedFolders: string[]
  isLoading: boolean
  hasFolders: boolean

  // Actions
  initialize: (projectId: string) => Promise<void>
  setCurrentFolder: (folderId: string | null) => void
  toggleFolder: (folderId: string) => void
  createFolder: (name: string, parentId: string | null, projectId: string) => Promise<void>
  moveItem: (itemId: string, targetFolderId: string | null) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  renameItem: (itemId: string, newName: string) => Promise<void>
}

export const useProjectFileSystemStore = create<ProjectFileSystemStore>((set, get) => ({
  items: [],
  currentFolderId: null,
  expandedFolders: [],
  isLoading: false,
  hasFolders: false,

  initialize: async (projectId: string) => {
    set({ isLoading: true })
    try {
      const [foldersRes, formsRes] = await Promise.all([
        apiClient<any>(`/api/folders?projectId=${projectId}`),
        apiClient<any>(`/api/projects/${projectId}/forms`),
      ])

      const items: FileSystemItem[] = []

      if (foldersRes.success && foldersRes.data?.folders) {
        foldersRes.data.folders.forEach((f: any) => {
          items.push({
            id: `folder-${f.id}`,
            dbId: f.id,
            name: f.name,
            type: 'folder',
            parentId: f.parentId ? `folder-${f.parentId}` : null,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
          } as any)
        })
      }

      if (formsRes.success && formsRes.data?.forms) {
        formsRes.data.forms.forEach((f: any) => {
          items.push({
            id: `form-${f.id}`,
            dbId: f.id,
            name: f.title,
            type: 'form',
            parentId: f.folderId ? `folder-${f.folderId}` : null,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
            formSlug: f.slug,
            targetSheetId: f.targetSheetId,
          } as any)
        })
      }

      const hasFolders = items.some((i) => i.type === 'folder')
      set({ items, hasFolders })
    } catch (error) {
      console.error('Failed to initialize project file system:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentFolder: (folderId) => {
    set({ currentFolderId: folderId })
  },

  toggleFolder: (folderId) => {
    const { expandedFolders } = get()
    if (expandedFolders.includes(folderId)) {
      set({ expandedFolders: expandedFolders.filter((id) => id !== folderId) })
    } else {
      set({ expandedFolders: [...expandedFolders, folderId] })
    }
  },

  createFolder: async (name, parentId, projectId) => {
    const dbParentId = parentId ? parentId.replace('folder-', '') : null

    try {
      const res = await apiClient<any>('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: dbParentId, projectId }),
      })

      if (res.success && res.data?.folder) {
        const f = res.data.folder
        const newFolder: any = {
          id: `folder-${f.id}`,
          dbId: f.id,
          name: f.name,
          type: 'folder',
          parentId,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        }
        set((state) => ({
          items: [...state.items, newFolder],
          hasFolders: true,
        }))
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  },

  moveItem: async (itemId, targetFolderId) => {
    const item = get().items.find((i) => i.id === itemId)
    if (!item) return

    const dbTargetId = targetFolderId ? targetFolderId.replace('folder-', '') : null
    const isForm = itemId.startsWith('form-')
    const dbId = itemId.replace(isForm ? 'form-' : 'folder-', '')

    try {
      if (isForm) {
        await apiClient(`/api/groups/1/forms/${dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId: dbTargetId }),
        })
      } else {
        await apiClient(`/api/folders/${dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentId: dbTargetId }),
        })
      }

      set((state) => ({
        items: state.items.map((i) =>
          i.id === itemId
            ? { ...i, parentId: targetFolderId, updatedAt: new Date().toISOString() }
            : i
        ),
      }))
    } catch (error) {
      console.error('Failed to move item:', error)
      const { currentFolderId } = get()
      // Refresh on failure — re-initialize requires projectId which we don't store here
    }
  },

  deleteItem: async (itemId) => {
    const isForm = itemId.startsWith('form-')
    const dbId = itemId.replace(isForm ? 'form-' : 'folder-', '')

    try {
      if (!isForm) {
        await apiClient(`/api/folders/${dbId}`, { method: 'DELETE' })
      }

      set((state) => {
        const newItems = state.items.filter((item) => item.id !== itemId)
        return {
          items: newItems,
          hasFolders: newItems.some((i) => i.type === 'folder'),
        }
      })
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  },

  renameItem: async (itemId, newName) => {
    const isForm = itemId.startsWith('form-')
    const dbId = itemId.replace(isForm ? 'form-' : 'folder-', '')

    try {
      if (isForm) {
        await apiClient(`/api/groups/1/forms/${dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newName }),
        })
      } else {
        await apiClient(`/api/folders/${dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        })
      }

      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId
            ? { ...item, name: newName, updatedAt: new Date().toISOString() }
            : item
        ),
      }))
    } catch (error) {
      console.error('Failed to rename item:', error)
    }
  },
}))
