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
            // Assume group 1 for now or pass it in. Since store is global, we might need a better way to handle groups.
            // For this quick fix, we'll fetch group 1 forms.
            const response = await fetch('http://localhost:5005/api/groups/1/forms');
            const data = await response.json();
            
            if (data.success && data.data.forms) {
                const apiForms = data.data.forms;
                
                set(state => {
                    const existingItems = state.items;
                    const newItems = [...existingItems];
                    
                    apiForms.forEach((form: any) => {
                        // Check if form already exists in items to avoid duplicates
                        // We use the slug as a unique identifier check or trying to match names
                        // ideally we'd use IDs but local IDs and backend IDs might conflict in this hybrid setup.
                        // Let's rely on a custom property 'backendId' or similar, or just match by ID if we can ensure uniqueness.
                        // For this demo/fix, let's map backend forms to FileItems.
                        
                        const exists = existingItems.some(item => item.id === `form-${form.id}`);
                        
                        if (!exists) {
                            newItems.push({
                                id: `form-${form.id}`,
                                name: form.title,
                                type: 'form',
                                parentId: null, // Root folder
                                createdAt: form.created_at,
                                updatedAt: form.updated_at,
                                // Add extra metadata if needed
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
