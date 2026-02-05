
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface MediaItem {
  url: string
  name: string
  type: string // MIME type
  size?: number
  preview?: string // Optional base64 preview
}

interface MediaLightboxProps {
  isOpen: boolean
  onClose: () => void
  items: MediaItem[]
  initialIndex?: number
}

// Helper function to format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return 'Unknown Size'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export function MediaLightbox({ isOpen, onClose, items, initialIndex = 0 }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Reset index when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  const navigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(prev => prev > 0 ? prev - 1 : items.length - 1)
    } else {
      setCurrentIndex(prev => prev < items.length - 1 ? prev + 1 : 0)
    }
  }

  // Filter only displayable items? Or show placeholder for non-images?
  // Ideally, this component receives ALREADY filtered renderable items, or handles non-renderables gracefully.
  // For now, assuming caller passes mostly images/pdfs or we handle basic types.

  const currentItem = items[currentIndex]
  if (!currentItem) return null

  // Check if renderable image
  const isImage = currentItem.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(currentItem.name)
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-black/95 border-none" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Media Preview: {currentItem.name}</DialogTitle>
        
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Main Content */}
          <div className="relative max-w-full max-h-[85vh] p-4 flex items-center justify-center animate-[fadeIn_0.3s_ease-out]">
            {isImage ? (
               <Image 
                  src={currentItem.url || currentItem.preview || ''} 
                  alt={currentItem.name} 
                  width={1200} 
                  height={800} 
                  className="max-h-[85vh] w-auto h-auto object-contain" 
                  unoptimized // Allow external URLs
               />
            ) : (
                <div className="flex flex-col items-center justify-center text-white p-10 border border-white/20 rounded-lg bg-white/5">
                    <p className="mb-4 text-lg">Preview not available for this file type</p>
                    <p className="text-sm text-white/50">{currentItem.type}</p>
                </div>
            )}
          </div>

          {/* Close Button */}
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 h-10 w-10 z-50" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation */}
          {items.length > 1 && (
            <>
              <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 transition-transform hover:scale-110 z-50" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 transition-transform hover:scale-110 z-50" onClick={() => navigate('next')}>
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Footer Info & Actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-50">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="font-medium truncate max-w-[50vw]">{currentItem.name}</p>
                <p className="text-sm text-white/70">
                    {formatFileSize(currentItem.size)} • {currentIndex + 1} of {items.length}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20" 
                onClick={() => { 
                    const link = document.createElement('a'); 
                    link.href = currentItem.url || currentItem.preview || ''; 
                    link.download = currentItem.name; 
                    link.target = '_blank';
                    link.click() 
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Thumbnails (if multiple) */}
          {items.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm max-w-[90vw] overflow-x-auto z-50">
              {items.map((item, idx) => {
                 const isItemImage = item.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name);
                 return (
                    <button 
                        key={idx} 
                        onClick={() => setCurrentIndex(idx)} 
                        className={cn(
                            'relative w-12 h-12 rounded overflow-hidden transition-all duration-200 flex-shrink-0 bg-white/10',
                            idx === currentIndex ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'
                        )}
                    >
                    {isItemImage ? (
                        <Image src={item.url || item.preview || ''} alt={item.name} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold">DOC</div>
                    )}
                    </button>
                 );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
