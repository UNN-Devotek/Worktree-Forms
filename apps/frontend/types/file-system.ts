export type FileSystemItemType = 'folder' | 'form'

export interface FileSystemItem {
  id: string
  name: string
  type: FileSystemItemType
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export interface Folder extends FileSystemItem {
  type: 'folder'
}

export interface FormItem extends FileSystemItem {
  type: 'form'
  status: 'draft' | 'published'
  submissionsCount?: number
}

export interface FileSystemState {
  currentFolderId: string | null
  items: FileSystemItem[]
  expandedFolders: string[]
}
