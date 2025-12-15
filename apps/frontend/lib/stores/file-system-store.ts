import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FileSystemItem, Folder } from '@/types/file-system'
import { nanoid } from 'nanoid'

interface FileSystemStore {
  items: FileSystemItem[]
  currentFolderId: string | null
  expandedFolders: string[]
  
  // Actions
  initialize: () => void
  setCurrentFolder: (folderId: string | null) => void
  toggleFolder: (folderId: string) => void
  createFolder: (name: string, parentId: string | null) => void
  moveItem: (itemId: string, targetFolderId: string | null) => void
  deleteItem: (itemId: string) => void
  renameItem: (itemId: string, newName: string) => void
}

// Mock initial data
const initialItems: FileSystemItem[] = []

export const useFileSystemStore = create<FileSystemStore>()(
  persist(
    (set, get) => ({
      items: initialItems,
      currentFolderId: null,
      expandedFolders: [],

      initialize: async () => {
        // Initial load from local storage (handled by persist), but let's sync with API
        try {
            // Assume group 1 for now
            // Use apiClient to respect base URL and auth headers
            const { apiClient } = await import('@/lib/api');
            const data = await apiClient<any>('/api/groups/1/forms');
            
            if (data.success && data.data.forms) {
                const apiForms = data.data.forms;
                
                set(state => {
                    const existingItems = state.items;
                    const newItems = [...existingItems];
                    
                    apiForms.forEach((form: any) => {
                        const exists = existingItems.some(item => item.id === `form-${form.id}`);
                        
                        if (!exists) {
                            newItems.push({
                                id: `form-${form.id}`,
                                name: form.title,
                                type: 'form',
                                parentId: null, // Root folder
                                createdAt: form.created_at,
                                updatedAt: form.updated_at,
                                formSlug: form.slug
                            } as any);
                        }
                    });
                    
                    return { items: newItems };
                });
            }
        } catch (error) {
            console.error("Failed to sync with API:", error);
        }
      },

      setCurrentFolder: (folderId) => {
        set({ currentFolderId: folderId })
      },

      toggleFolder: (folderId) => {
        const { expandedFolders } = get()
        if (expandedFolders.includes(folderId)) {
          set({ expandedFolders: expandedFolders.filter(id => id !== folderId) })
        } else {
          set({ expandedFolders: [...expandedFolders, folderId] })
        }
      },

      createFolder: (name, parentId) => {
        const newFolder: Folder = {
          id: `folder-${nanoid()}`,
          name,
          type: 'folder',
          parentId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set(state => ({ items: [...state.items, newFolder] }))
      },

      moveItem: (itemId, targetFolderId) => {
        set(state => ({
          items: state.items.map(item => 
            item.id === itemId ? { ...item, parentId: targetFolderId, updatedAt: new Date().toISOString() } : item
          )
        }))
      },

      deleteItem: (itemId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== itemId)
        }))
      },
      
      renameItem: (itemId, newName) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === itemId? { ...item, name: newName, updatedAt: new Date().toISOString() } : item
          )
        }))
      }
    }),
    {
      name: 'file-system-storage',
    }
  )
)
