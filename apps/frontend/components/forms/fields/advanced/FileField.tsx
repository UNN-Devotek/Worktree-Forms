'use client'

import { forwardRef, useState, useRef, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'
import { Upload, X, Image as ImageIcon, FileText, File, ZoomIn, ChevronLeft, ChevronRight, Download, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useFormUpload } from '@/contexts/form-upload-context'

// Uploaded file metadata from server
interface UploadedFileData {
  filename: string
  object_key: string
  url: string
  size: number
  content_type: string
}

interface FileWithPreview {
  file: File
  preview?: string
  progress: number
  uploadComplete?: boolean
  uploadedData?: UploadedFileData
  uploadError?: boolean
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

// Helper function to get file icon based on mime type
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType.startsWith('video/')) return FileText
  if (mimeType === 'application/pdf') return FileText
  return File
}

// Helper function to check if file is an image
const isImageFile = (file: File): boolean => file.type.startsWith('image/')

// --- Main FileField Component ---
// --- Main FileField Component ---
const FileFieldRender = forwardRef<HTMLInputElement, { field: FormFieldBase }>(
  ({ field }, _ref) => { // Removed ref parameter
    // Common state and refs for render and preview modes
    const form = useFormContext()
    const error = form.formState.errors[field.name]?.message as string
    const { uploadFile, isConfigured } = useFormUpload()

    const fieldNameRef = useRef(field.name)
    fieldNameRef.current = field.name

    useEffect(() => {
        const fieldName = fieldNameRef.current
        form.register(fieldName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const fileInputRef = useRef<HTMLInputElement>(null)
    const activeIntervalsRef = useRef<Set<NodeJS.Timeout>>(new Set())
    const isMountedRef = useRef(true)

    const [files, setFiles] = useState<FileWithPreview[]>(() => {
      const existingValue = form.getValues(field.name)
      if (Array.isArray(existingValue)) {
        return existingValue.map((fileData: UploadedFileData) => ({
          // Cast as File since we only need metadata for display and won't read content of already uploaded files
          file: {
            name: fileData.filename,
            size: fileData.size, 
            type: fileData.content_type,
            lastModified: 0,
            webkitRelativePath: '',
            arrayBuffer: async () => new ArrayBuffer(0),
            slice: () => new Blob(),
            stream: () => new ReadableStream(),
            text: async () => '',
          } as unknown as File,
          progress: 100,
          uploadComplete: true,
          uploadedData: fileData,
          preview: fileData.url
        }))
      }
      return []
    })
    const [isDragging, setIsDragging] = useState(false)
    const [lightboxOpen, setLightboxOpen] = useState(0) // 0 for closed, 1 for open
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
      isMountedRef.current = true
      return () => {
        isMountedRef.current = false
        activeIntervalsRef.current.forEach(intervalId => clearInterval(intervalId))
        activeIntervalsRef.current.clear()
      }
    }, [])

    const validateFile = (file: File): boolean => {
      const maxSize = field.maxFileSize || 10 * 1024 * 1024
      const acceptValue = field.accept?.trim()

      if (file.size > maxSize) return false
      if (!acceptValue || acceptValue === '*') return true

      const acceptTokens = acceptValue.split(',').map(t => t.trim().toLowerCase())
      const fileType = file.type.toLowerCase()
      const fileTypePrefix = fileType.split('/')[0]
      const fileName = file.name.toLowerCase()
      const dotIndex = fileName.lastIndexOf('.')
      const fileExtension = dotIndex !== -1 ? fileName.substring(dotIndex) : ''

      return acceptTokens.some(token => {
        if (token === '*') return true
        if (token.endsWith('/*')) return token.split('/')[0] === fileTypePrefix
        if (token.startsWith('.')) return fileExtension === token
        return fileType === token
      })
    }

    const updateFormValue = (filesList: FileWithPreview[]) => {
      const uploadedData = filesList
        .filter(f => f.uploadComplete && f.uploadedData)
        .map(f => f.uploadedData!)
      form?.setValue(field.name, uploadedData.length > 0 ? uploadedData : undefined)
    }

    const processFiles = async (fileList: FileList) => {
      const newFiles: FileWithPreview[] = []

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (!validateFile(file)) continue

        const fileWithPreview: FileWithPreview = { file, progress: 0 }

        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const preview = e.target?.result as string
            setFiles(prev => prev.map(f => f.file === file ? { ...f, preview } : f))
          }
          reader.readAsDataURL(file)
        }

        newFiles.push(fileWithPreview)
      }

      if (!field.allowMultiple && newFiles.length > 0) {
        setFiles([newFiles[0]])
      } else {
        setFiles(prev => [...prev, ...newFiles])
      }

      uploadFilesToServer(newFiles)
    }

    const uploadFilesToServer = async (newFiles: FileWithPreview[]) => {
      for (const fileItem of newFiles) {
        setFiles(prev => prev.map(f => f.file === fileItem.file ? { ...f, progress: 10 } : f))

        try {
          if (!isConfigured) {
            await simulateFallbackUpload(fileItem)
            continue
          }

          setFiles(prev => prev.map(f => f.file === fileItem.file ? { ...f, progress: 30 } : f))
          const uploadedData = await uploadFile(fileItem.file)

          if (uploadedData) {
            setFiles(prev => {
              const updated = prev.map(f =>
                f.file === fileItem.file ? { ...f, progress: 100, uploadComplete: true, uploadedData } : f
              )
              setTimeout(() => updateFormValue(updated), 0)
              return updated
            })
          } else {
            setFiles(prev => prev.map(f =>
              f.file === fileItem.file ? { ...f, progress: 0, uploadError: true } : f
            ))
          }
        } catch (error) {
          console.error('Upload error:', error)
          setFiles(prev => prev.map(f =>
            f.file === fileItem.file ? { ...f, progress: 0, uploadError: true } : f
          ))
        }
      }

      setFiles(prev => {
        return prev
      })
    }

    const simulateFallbackUpload = async (fileItem: FileWithPreview) => {
      return new Promise<void>((resolve) => {
        let progress = 10
        const interval = setInterval(() => {
          if (!isMountedRef.current) {
            clearInterval(interval)
            activeIntervalsRef.current.delete(interval)
            resolve()
            return
          }

          progress = Math.min(progress + Math.random() * 15 + 5, 100)
          setFiles(prev => prev.map(f =>
            f.file === fileItem.file ? { ...f, progress: Math.round(progress), uploadComplete: progress >= 100 } : f
          ))

          if (progress >= 100) {
            clearInterval(interval)
            activeIntervalsRef.current.delete(interval)
            resolve()
          }
        }, 100)
        activeIntervalsRef.current.add(interval)
      })
    }

    const completedImages = files.filter(f => isImageFile(f.file) && f.uploadComplete && !f.uploadError && f.preview)
    const nonImageFiles = files.filter(f => !isImageFile(f.file) && f.uploadComplete && !f.uploadError)
    const uploadingFiles = files.filter(f => !f.uploadComplete && !f.uploadError)
    const errorFiles = files.filter(f => f.uploadError)

    const openLightbox = (index: number) => {
      setCurrentImageIndex(index)
      setLightboxOpen(completedImages.length > 0 ? 1 : 0) // Set to 1 (true) if images exist
    }

    const navigateLightbox = (direction: 'prev' | 'next') => {
      if (direction === 'prev') {
        setCurrentImageIndex(prev => prev > 0 ? prev - 1 : completedImages.length - 1)
      } else {
        setCurrentImageIndex(prev => prev < completedImages.length - 1 ? prev + 1 : 0)
      }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) processFiles(e.target.files)
    }

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files)
    }

    const handleRemoveFile = (index: number) => {
      const newFiles = files.filter((_, i) => i !== index)
      setFiles(newFiles)
      updateFormValue(newFiles)
    }

    // Common content for render  modes
    return (
      <FieldWrapper id={field.id} label={field.label} helpText={field.helpText} error={error} required={field.required} colSpan={field.colSpan}>
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
              isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-accent/50'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={cn('mx-auto h-8 w-8 mb-2 transition-all duration-200', isDragging ? 'text-primary scale-110' : 'text-muted-foreground')} />
            <p className="text-sm text-foreground font-medium">{isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}</p>
            <p className="text-xs text-muted-foreground mt-1">Max file size: {formatFileSize(field.maxFileSize || 10485760)}</p>
            {field.allowMultiple && <p className="text-xs text-muted-foreground">Multiple files allowed</p>}
            {field.accept && <p className="text-xs text-muted-foreground mt-1">Accepted types: {field.accept}</p>}
            <input ref={fileInputRef} type="file" accept={field.accept || '*'} multiple={field.allowMultiple} onChange={handleFileChange} className="sr-only" aria-invalid={!!error} aria-describedby={error ? `${field.id}-error` : field.helpText ? `${field.id}-help` : undefined} />
          </div>

          {errorFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-destructive">Failed Uploads ({errorFiles.length})</p>
              {errorFiles.map((fileItem, index) => (
                <div key={`error-${fileItem.file.name}-${index}`} className="flex items-center gap-3 p-3 border border-destructive/50 rounded-lg bg-destructive/10 group">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-destructive/20 rounded">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(fileItem.file.size)}</p>
                    <p className="text-xs text-destructive mt-1">Upload failed - click retry</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setFiles(prev => prev.map(f => f.file === fileItem.file ? { ...f, uploadError: false, progress: 0 } : f)); uploadFilesToServer([{ ...fileItem, uploadError: false, progress: 0 }]) }} className="mr-2">Retry</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFile(files.indexOf(fileItem))}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}

          {uploadingFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              {uploadingFiles.map((fileItem, index) => {
                const isImage = isImageFile(fileItem.file)
                return (
                  <div key={`uploading-${fileItem.file.name}-${index}`} className="flex items-center gap-3 p-3 border rounded-lg bg-accent/30 animate-pulse group">
                    {isImage && fileItem.preview ? (
                      <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden border opacity-50">
                        <Image src={fileItem.preview} alt={fileItem.file.name} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary/10 rounded"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(fileItem.file.size)}</p>
                      <div className="mt-2">
                        <Progress value={fileItem.progress} className="h-1.5 transition-all duration-200" />
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />Uploading... {fileItem.progress}%</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFile(files.indexOf(fileItem))} className="opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-4 w-4" /></Button>
                  </div>
                )
              })}
            </div>
          )}

          {completedImages.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Uploaded Images ({completedImages.length})</p>
              <div className={cn('grid gap-3', completedImages.length === 1 ? 'grid-cols-1' : completedImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
                {completedImages.map((fileItem, index) => (
                  <div key={`gallery-${fileItem.file.name}-${index}`} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50" onClick={() => openLightbox(index)}>
                    <Image src={fileItem.preview!} alt={fileItem.file.name} fill className="object-cover transition-transform duration-300 group-hover:scale-110" unoptimized />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all duration-300 flex items-center justify-center">
                      <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300 bg-background/90 rounded-full p-2"><ZoomIn className="h-5 w-5 text-foreground" /></div>
                    </div>
                    <div className="absolute top-2 right-2 transform scale-0 animate-[scaleIn_0.3s_ease-out_forwards] bg-accent rounded-full p-1 shadow-md">
                      <svg className="w-3 h-3 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <Button type="button" variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleRemoveFile(files.indexOf(fileItem)) }} className="absolute top-2 left-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"><X className="h-4 w-4" /></Button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"><p className="text-xs text-foreground truncate">{fileItem.file.name}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nonImageFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Other Files ({nonImageFiles.filter(f => f.uploadComplete).length})</p>
              {nonImageFiles.filter(f => f.uploadComplete).map((fileItem, index) => {
                const Icon = getFileIcon(fileItem.file.type)
                return (
                  <div key={`file-${fileItem.file.name}-${index}`} className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors group">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-muted rounded"><Icon className="h-6 w-6 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(fileItem.file.size)}</p>
                      <p className="text-xs text-accent-foreground mt-1 flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-accent rounded-full"><svg className="w-2.5 h-2.5 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>
                        Upload complete
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFile(files.indexOf(fileItem))} className="opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-4 w-4" /></Button>
                  </div>
                )
              })}
            </div>
          )}

          <Dialog open={lightboxOpen === 1} onOpenChange={(open) => setLightboxOpen(open ? 1 : 0)}>
            <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-black/95 border-none">
              <DialogTitle className="sr-only">Image Preview: {completedImages[currentImageIndex]?.file.name}</DialogTitle>
              {completedImages[currentImageIndex] && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative max-w-full max-h-[85vh] animate-[fadeIn_0.3s_ease-out]">
                    <Image src={completedImages[currentImageIndex].preview!} alt={completedImages[currentImageIndex].file.name} width={1200} height={800} className="max-h-[85vh] w-auto h-auto object-contain" unoptimized />
                  </div>
                  <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 h-10 w-10" onClick={() => setLightboxOpen(0)}><X className="h-6 w-6" /></Button>
                  {completedImages.length > 1 && (
                    <>
                      <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 transition-transform hover:scale-110" onClick={() => navigateLightbox('prev')}><ChevronLeft className="h-8 w-8" /></Button>
                      <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 transition-transform hover:scale-110" onClick={() => navigateLightbox('next')}><ChevronRight className="h-8 w-8" /></Button>
                    </>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <p className="font-medium">{completedImages[currentImageIndex].file.name}</p>
                        <p className="text-sm text-white/70">{formatFileSize(completedImages[currentImageIndex].file.size)} • {currentImageIndex + 1} of {completedImages.length}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => { const link = document.createElement('a'); link.href = completedImages[currentImageIndex].preview!; link.download = completedImages[currentImageIndex].file.name; link.click() }}><Download className="h-4 w-4 mr-2" />Download</Button>
                    </div>
                  </div>
                  {completedImages.length > 1 && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                      {completedImages.map((img, idx) => (
                        <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={cn('relative w-12 h-12 rounded overflow-hidden transition-all duration-200', idx === currentImageIndex ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100')}>
                          <Image src={img.preview!} alt={img.file.name} fill className="object-cover" unoptimized />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </FieldWrapper>
    );
  }
);
FileFieldRender.displayName = 'FileFieldRender'

export const FileField = forwardRef<HTMLInputElement, { field: FormFieldBase, mode?: 'builder' | 'render' | 'preview' }>(
  ({ field, mode = 'render' }, ref) => {
    
    // Builder Mode: Static Placeholder
    if (mode === 'builder') {
      return (
        <FieldWrapper id={field.id} label={field.label} helpText={field.helpText} required={field.required} colSpan={field.colSpan}>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-not-allowed opacity-70">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">Max file size: {formatFileSize(field.maxFileSize || 10485760)}</p>
            {field.allowMultiple && <p className="text-xs text-muted-foreground">Multiple files allowed</p>}
          </div>
        </FieldWrapper>
      )
    }

    // Preview Mode: Static visual (for now, to avoid complexity of local state without context)
    // or we could reuse Render if wrapped in a mock context, but simpler to just show visual placeholder
    // Preview Mode: Full functionality now that we want to test uploads
    if (mode === 'preview') {
       return <FileFieldRender field={field} ref={ref} />
    }

    // Render Mode: Full functionality
    return <FileFieldRender field={field} ref={ref} />
  }
)
FileField.displayName = 'FileField'
