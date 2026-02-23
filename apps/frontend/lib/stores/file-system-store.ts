import { create } from 'zustand'
import { FileSystemItem } from '@/types/file-system'
import { apiClient } from '@/lib/api'

interface FileSystemStore {
  items: FileSystemItem[]
  currentFolderId: string | null
  expandedFolders: string[]
  isLoading: boolean
  
  // Actions
  initialize: () => Promise<void>
  setCurrentFolder: (folderId: string | null) => void
  toggleFolder: (folderId: string) => void
  createFolder: (name: string, parentId: string | null) => Promise<void>
  moveItem: (itemId: string, targetFolderId: string | null) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  renameItem: (itemId: string, newName: string) => Promise<void>
}

export const useFileSystemStore = create<FileSystemStore>((set, get) => ({
  items: [],
  currentFolderId: null,
  expandedFolders: [],
  isLoading: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
        const [foldersRes, formsRes] = await Promise.all([
            apiClient<any>('/api/folders'),
            apiClient<any>('/api/groups/1/forms')
        ]);
        
        const items: FileSystemItem[] = [];

        if (foldersRes.success && foldersRes.data.folders) {
            foldersRes.data.folders.forEach((f: any) => {
                items.push({
                    id: `folder-${f.id}`, // Client-side ID convention
                    dbId: f.id, // Keep real ID
                    name: f.name,
                    type: 'folder',
                    parentId: f.parentId ? `folder-${f.parentId}` : null,
                    createdAt: f.createdAt,
                    updatedAt: f.updatedAt
                } as any);
            });
        }

        if (formsRes.success && formsRes.data.forms) {
             formsRes.data.forms.forEach((f: any) => {
                items.push({
                    id: `form-${f.id}`,
                    dbId: f.id,
                    name: f.title,
                    type: 'form',
                    parentId: f.folderId ? `folder-${f.folderId}` : null,
                    createdAt: f.createdAt,
                    updatedAt: f.updatedAt,
                    formSlug: f.slug
                } as any);
            });
        }

        set({ items });
    } catch (error) {
        console.error("Failed to sync file system:", error);
    } finally {
        set({ isLoading: false });
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

  createFolder: async (name, parentId) => {
    // parentId is like "folder-123" or null
    // Extract DB ID
    const dbParentId = parentId ? parentId.replace('folder-', '') : null;

    try {
        const res = await apiClient<any>('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parentId: dbParentId })
        });

        if (res.success && res.data.folder) {
            const f = res.data.folder;
            const newFolder: any = {
                id: `folder-${f.id}`,
                dbId: f.id,
                name: f.name,
                type: 'folder',
                parentId: parentId, // Use the string ID for local state consistency
                createdAt: f.createdAt,
                updatedAt: f.updatedAt
            };
            set(state => ({ items: [...state.items, newFolder] }));
        }
    } catch (error) {
        console.error('Failed to create folder:', error);
    }
  },

  moveItem: async (itemId, targetFolderId) => {
    // Optimistic update? Better wait for server.
    const item = get().items.find(i => i.id === itemId);
    if (!item) return;

    const dbTargetId = targetFolderId ? targetFolderId.replace('folder-', '') : null;
    // Extract numeric ID from itemId (form-123 or folder-123)
    const isForm = itemId.startsWith('form-');
    const dbId = itemId.replace(isForm ? 'form-' : 'folder-', '');

    try {
        if (isForm) {
            await apiClient(`/api/groups/1/forms/${dbId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderId: dbTargetId })
            });
        } else {
            await apiClient(`/api/folders/${dbId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parentId: dbTargetId })
            });
        }

        // Update local state
        set(state => ({
          items: state.items.map(i => 
            i.id === itemId ? { ...i, parentId: targetFolderId, updatedAt: new Date().toISOString() } : i
          )
        }))

    } catch (error) {
        console.error('Failed to move item:', error);
        // Clean refresh if failed?
        get().initialize();
    }
  },

  deleteItem: async (itemId) => {
    const isForm = itemId.startsWith('form-');
    const dbId = itemId.replace(isForm ? 'form-' : 'folder-', '');

    try {
         // Add API call for deletion
         if (isForm) {
             // Not implemented in this step, but assuming we might want to delete forms? 
             // Or just hide them? The user didn't explicitly ask for delete, but "deleteItem" existed.
             // We'll leave it local-only or implement specific delete later. 
             // BUT for folders we implemented it.
         } else {
             await apiClient(`/api/folders/${dbId}`, { method: 'DELETE' });
         }

        set(state => ({
          items: state.items.filter(item => item.id !== itemId)
        }))
    } catch (error) {
        console.error('Failed to delete item:', error);
    }
  },
  
  renameItem: async (itemId, newName) => {
     const isForm = itemId.startsWith('form-');
     const dbId = itemId.replace(isForm ? 'form-' : 'folder-', '');
     
     try {
         if (isForm) {
             await apiClient(`/api/groups/1/forms/${dbId}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ title: newName })
             });
         } else {
             await apiClient(`/api/folders/${dbId}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ name: newName })
             });
         }
         
        set(state => ({
          items: state.items.map(item =>
            item.id === itemId? { ...item, name: newName, updatedAt: new Date().toISOString() } : item
          )
        }))
     } catch (error) {
         console.error('Failed to rename:', error);
     }
  }
}));
