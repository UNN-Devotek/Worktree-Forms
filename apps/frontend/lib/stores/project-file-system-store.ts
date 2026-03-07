import { create } from 'zustand'
import { FileSystemItem, FormItem } from '@/types/file-system'
import { apiClient } from '@/lib/api'

interface FolderApiItem {
  id: string
  name: string
  parentId?: string | null
  createdAt: string
  updatedAt: string
}

interface FormApiItem {
  formId?: string
  id?: string
  name?: string
  title?: string
  slug?: string
  folderId?: string | null
  targetSheetId?: string
  createdAt: string
  updatedAt: string
}

interface ProjectFileSystemStore {
  items: (FileSystemItem | FormItem)[]
  currentFolderId: string | null
  expandedFolders: string[]
  isLoading: boolean
  hasFolders: boolean
  projectId: string | null

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
  projectId: null,

  initialize: async (projectId: string) => {
    set({ isLoading: true, items: [], projectId })
    try {
      const [foldersRes, formsRes] = await Promise.all([
        apiClient<{ success: boolean; data?: { folders: FolderApiItem[] } }>(`/api/folders?projectId=${projectId}`),
        apiClient<{ success: boolean; data?: { forms: FormApiItem[] } }>(`/api/projects/${projectId}/forms`),
      ])

      const items: (FileSystemItem | FormItem)[] = []

      if (foldersRes.success && foldersRes.data?.folders) {
        foldersRes.data.folders.forEach((f: FolderApiItem) => {
          items.push({
            id: `folder-${f.id}`,
            dbId: f.id,
            name: f.name,
            type: 'folder' as const,
            parentId: f.parentId ? `folder-${f.parentId}` : null,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
          })
        })
      }

      if (formsRes.success && formsRes.data?.forms) {
        formsRes.data.forms.forEach((f: FormApiItem) => {
          // FormEntity uses formId (nanoid string) and name — not id/title/slug
          const id = f.formId ?? f.id
          items.push({
            id: `form-${id}`,
            dbId: id,
            name: f.name ?? f.title ?? 'Untitled Form',
            type: 'form' as const,
            parentId: f.folderId ? `folder-${f.folderId}` : null,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
            formSlug: f.formId ?? f.slug ?? id,
            targetSheetId: f.targetSheetId,
          })
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
      const res = await apiClient<{ success: boolean; data?: { folder: FolderApiItem } }>('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: dbParentId, projectId }),
      })

      if (res.success && res.data?.folder) {
        const f = res.data.folder as FolderApiItem
        const newFolder: FileSystemItem = {
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
    const { projectId } = get()
    const item = get().items.find((i) => i.id === itemId)
    if (!item) return

    const dbTargetId = targetFolderId ? targetFolderId.replace('folder-', '') : null
    const isForm = itemId.startsWith('form-')
    const dbId = itemId.replace(isForm ? 'form-' : 'folder-', '')

    try {
      if (isForm) {
        await apiClient<{ success: boolean }>(`/api/projects/${projectId}/forms/${dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId: dbTargetId }),
        })
      } else {
        await apiClient<{ success: boolean }>(`/api/folders/${dbId}`, {
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
    }
  },

  deleteItem: async (itemId) => {
    const { projectId } = get()
    const isForm = itemId.startsWith('form-')
    const dbId = itemId.replace(isForm ? 'form-' : 'folder-', '')

    try {
      if (isForm) {
        await apiClient<{ success: boolean }>(`/api/projects/${projectId}/forms/${dbId}`, { method: 'DELETE' })
      } else {
        await apiClient<{ success: boolean }>(`/api/folders/${dbId}`, { method: 'DELETE' })
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
    const { projectId } = get()
    const isForm = itemId.startsWith('form-')
    const dbId = itemId.replace(isForm ? 'form-' : 'folder-', '')

    try {
      if (isForm) {
        await apiClient(`/api/projects/${projectId}/forms/${dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
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
