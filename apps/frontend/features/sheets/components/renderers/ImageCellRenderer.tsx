'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Loader2, X, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { uploadSheetFile } from '@/features/sheets/server/upload-action';
import { CustomCellRendererProps } from 'ag-grid-react';

export const ImageCellRenderer = (props: CustomCellRendererProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle various data shapes
  const cellData = props.value;
  let displayUrl = '';

  if (cellData) {
      if (typeof cellData === 'string') {
          // If stored as stringified JSON or direct URL
          if (cellData.startsWith('http') || cellData.startsWith('/')) {
              displayUrl = cellData;
          } else {
              try {
                  const parsed = JSON.parse(cellData);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                      displayUrl = parsed[0].url;
                  } else if (parsed.url) {
                      displayUrl = parsed.url;
                  }
              } catch (e) { /* Ignore parse error */ }
          }
      } else if (typeof cellData === 'object') {
          // If stored as object { value, type, images }
          if (cellData.images && Array.isArray(cellData.images) && cellData.images.length > 0) {
              displayUrl = cellData.images[0].url;
          } else if (cellData.value) {
              // Fallback to value if it's a URL
               if (cellData.value.startsWith('http') || cellData.value.startsWith('/')) {
                   displayUrl = cellData.value;
               }
          }
      }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadSheetFile(formData);

      if (result.success && result.attachment) {
        // Construct new cell data
        // We want to store the structured data
        const newCellData = {
            value: result.url,
            type: 'image',
            images: [result.attachment]
        };

        // Update the cell value
        props.node.setDataValue(props.column!.getColId(), newCellData);
        
        // Close dialog
        setIsOpen(false);
      } else {
        console.error('Upload failed:', result.error);
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
      // Prevent row selection or default grid actions
      e.stopPropagation(); 
      setIsOpen(true);
  };

  const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      props.node.setDataValue(props.column!.getColId(), null);
      setIsOpen(false);
  }

  return (
    <div className="flex items-center justify-center h-full w-full py-1">
      {displayUrl ? (
        <div className="relative h-full aspect-square group cursor-pointer" onClick={handleClick}>
           <img 
             src={displayUrl} 
             alt="Cell Image" 
             className="h-full w-full object-cover rounded hover:opacity-90 transition-opacity border border-border"
           />
           
           <Dialog open={isOpen} onOpenChange={setIsOpen}>
             <DialogContent className="max-w-3xl">
               <DialogHeader>
                 <DialogTitle>Image Preview</DialogTitle>
               </DialogHeader>
               <div className="flex flex-col items-center gap-4">
                 <div className="relative w-full h-[60vh] flex items-center justify-center bg-muted/20 rounded-md">
                    <img 
                        src={displayUrl} 
                        alt="Full size" 
                        className="max-w-full max-h-full object-contain" 
                    />
                 </div>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRemove}>
                        <X className="mr-2 h-4 w-4" /> Remove Image
                    </Button>
                    <Button onClick={() => window.open(displayUrl, '_blank')}>
                         Open Original
                    </Button>
                 </div>
               </div>
             </DialogContent>
           </Dialog>
        </div>
      ) : (
        <>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-primary" 
                onClick={handleClick}
                title="Upload Image"
            >
               <Upload className="h-4 w-4" />
            </Button>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Image</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                        {uploading ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                            </div>
                        ) : (
                            <>
                                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                <Button onClick={() => fileInputRef.current?.click()}>
                                    Select Image
                                </Button>
                                <input 
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <p className="text-xs text-muted-foreground mt-4">
                                    Supports JPG, PNG, GIF, WEBP
                                </p>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
      )}
    </div>
  );
};
