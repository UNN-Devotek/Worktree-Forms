'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'
import { DraggablePdfField } from './DraggablePdfField'
import { Document, Page, pdfjs } from 'react-pdf'

// Configure worker locally or via CDN. Using CDN for simplicity and reliability in this setup.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface PdfFormCanvasProps {
  pdfUrl: string
}

export function PdfFormCanvas({ pdfUrl }: PdfFormCanvasProps) {
  const { formSchema, currentPageIndex, addPage } = useFormBuilderStore()
  const [numPages, setNumPages] = React.useState<number | null>(null);

  // Use proxy to avoid CORS and Docker network issues
  // pdfUrl is now expected to be the Object Key
  const proxyUrl = `/api/pdf-proxy?key=${encodeURIComponent(pdfUrl)}`;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    
    // Auto-Pagination Logic
    // If the PDF has more pages than the form, automatically add pages to match.
    // This allows the user to immediately navigate effectively.
    if (formSchema && formSchema.pages) {
        const currentCount = formSchema.pages.length;
        if (numPages > currentCount) {
             const needed = numPages - currentCount;
             // We cannot loop addPage synchronously efficiently if it depends on state updates,
             // but assuming addPage is a standard immer/zustand action, we can call it.
             // However, to be safe and avoid React batching issues, we might just notify user or do it carefully.
             // Let's try to add them.
             for (let i = 0; i < needed; i++) {
                 addPage();
             }
        }
    }
  }

  // Use a ref to measure the container for relative coordinate calculations
  // We'll pass this ref to the drop handler logic if needed, or better yet,
  // we rely on the dnd-kit `over` rect data in the hook.
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'pdf-canvas',
    data: { 
        type: 'pdf-canvas',
        pageIndex: currentPageIndex
    }
  })

  // Gather all fields on the current page to render them on the overlay
  const currentPage = formSchema?.pages[currentPageIndex]
  const fields = currentPage?.sections?.flatMap(section => section.fields) || []

  // PDF Container Dimensions (standard letter ratio for now, or fit generic)
  // usage of exact pixels matches the previous implementation for consistency
  const width = 816 // 8.5 * 96
  const height = 1056 // 11 * 96

  return (
    <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 relative p-8 flex justify-center">
        <div 
            ref={setNodeRef}
            className={`relative bg-white shadow-lg border transition-colors ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            style={{ width, height, minHeight: height }}
        >

            <div className="absolute inset-0 z-0 overflow-hidden">
                <Document
                    file={proxyUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(err) => console.error('PDF Load Error:', err)}
                    loading={
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Loading PDF...
                        </div>
                    }
                    error={() => (
                        <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                            <div className="space-y-2">
                                <p className="text-red-500 font-medium">Error loading PDF</p>
                                <p className="text-xs max-w-[200px] break-words">Unable to load PDF</p>
                                <a href={`/api/pdf-proxy?key=${pdfUrl}`} target="_blank" rel="noreferrer" className="text-sm underline text-blue-500">
                                    Download File
                                </a>
                            </div>
                        </div>
                    )}
                    className="w-full h-full"
                >
                    <Page 
                        pageNumber={currentPageIndex + 1} 
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="pointer-events-none"
                    />
                </Document>
            </div>

            {/* Fields Overlay Layer */}
             <div className="absolute inset-0 z-10" style={{ pointerEvents: 'none' }}>
                  {/* We need overlay pointervents-none so we can click through to drop? 
                      No, the container is the drop zone. 
                      However, fields themselves need pointer events.
                   */}
                {fields.map(field => (
                    <div key={field.id} style={{ pointerEvents: 'auto' }}>
                         <DraggablePdfField field={field} />
                    </div>
                ))}
            </div>
            
            {/* Overlay hint if empty */}
            {fields.length === 0 && !isOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground bg-white/80 p-2 rounded">
                        Drag fields here from the left palette
                    </p>
                </div>
            )}
            
            {/* Page Count Indicator */}
            <div className="absolute bottom-[-40px] left-1/2 transform -translate-x-1/2 bg-zinc-800 text-white px-3 py-1 rounded-full text-xs opacity-75">
                PDF Page {currentPageIndex + 1} {numPages ? `of ${numPages}` : ''}
            </div>
        </div>
    </div>
  )
}
