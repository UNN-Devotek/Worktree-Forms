export type FileSystemItemType = 'folder' | 'form'

export interface FileSystemItem {
  id: string
  /** Database primary key (kept alongside the client-side prefixed `id`) */
  dbId?: string | number
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
  formSlug?: string
  targetSheetId?: string
  projectId?: string
}

export interface FileSystemState {
  currentFolderId: string | null
  items: FileSystemItem[]
  expandedFolders: string[]
}
