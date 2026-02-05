'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileIcon, Loader2, X, Upload, Download, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { uploadSheetFile } from '@/features/sheets/server/upload-action';
import { CustomCellRendererProps } from 'ag-grid-react';

export const AttachmentCellRenderer = (props: CustomCellRendererProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle various data shapes
  const cellData = props.value;
  let fileUrl = '';
  let fileName = 'File';
  let fileSize = '';

  if (cellData) {
      if (typeof cellData === 'string') {
          // If stored as stringified JSON or direct URL
          if (cellData.startsWith('http') || cellData.startsWith('/')) {
              fileUrl = cellData;
              fileName = cellData.split('/').pop() || 'File';
          } else {
              try {
                  const parsed = JSON.parse(cellData);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                      fileUrl = parsed[0].url;
                      fileName = parsed[0].title || parsed[0].filename || 'File';
                      fileSize = parsed[0].size ? Math.round(parsed[0].size / 1024) + ' KB' : '';
                  } else if (parsed.url) {
                      fileUrl = parsed.url;
                      fileName = parsed.title || 'File';
                  }
              } catch (e) { /* Ignore parse error */ }
          }
      } else if (typeof cellData === 'object') {
          // If stored as object { value, type, files }
          if (cellData.files && Array.isArray(cellData.files) && cellData.files.length > 0) {
              fileUrl = cellData.files[0].url;
              fileName = cellData.files[0].title || 'File';
              fileSize = cellData.files[0].size ? Math.round(cellData.files[0].size / 1024) + ' KB' : '';
          } else if (cellData.value) {
               if (cellData.value.startsWith('http') || cellData.value.startsWith('/')) {
                   fileUrl = cellData.value;
                   fileName = fileUrl.split('/').pop() || 'File';
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
        const newCellData = {
            value: result.url,
            type: 'attachment',
            files: [result.attachment]
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
      e.stopPropagation(); 
      setIsOpen(true);
  };
  
  const handleDownload = () => {
      window.open(fileUrl, '_blank');
  };

  const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      props.node.setDataValue(props.column!.getColId(), null);
      setIsOpen(false);
  }

  return (
    <div className="flex items-center justify-center h-full w-full py-1">
      {fileUrl ? (
        <div className="flex items-center gap-2 group cursor-pointer w-full px-2" onClick={handleClick}>
           <FileIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
           <span className="truncate text-xs flex-1 text-left">{fileName}</span>
           
           <Dialog open={isOpen} onOpenChange={setIsOpen}>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>File details</DialogTitle>
               </DialogHeader>
               <div className="flex flex-col gap-4 p-4 border rounded-md">
                 <div className="flex items-center gap-4">
                     <div className="p-4 bg-muted rounded-full">
                        <FileIcon className="h-8 w-8 text-primary" />
                     </div>
                     <div className="flex-1 overflow-hidden">
                        <h4 className="font-medium truncate" title={fileName}>{fileName}</h4>
                        {fileSize && <p className="text-sm text-muted-foreground">{fileSize}</p>}
                     </div>
                 </div>
                 
                 <div className="flex flex-col gap-2 mt-2">
                    <Button onClick={handleDownload} className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                    <Button variant="outline" onClick={handleDownload} className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
                    </Button>
                    <Button variant="destructive" onClick={handleRemove} className="w-full text-destructive hover:bg-destructive/10">
                        <X className="mr-2 h-4 w-4" /> Remove File
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
                title="Upload File"
            >
               <Upload className="h-4 w-4" />
            </Button>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload File</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                        {uploading ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                            </div>
                        ) : (
                            <>
                                <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                <Button onClick={() => fileInputRef.current?.click()}>
                                    Select File
                                </Button>
                                <input 
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <p className="text-xs text-muted-foreground mt-4">
                                    Supports PDF, DOCX, XLSX, etc.
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
