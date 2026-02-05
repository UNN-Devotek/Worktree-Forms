'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { parseImportFile } from '@/lib/import-export.utils';

interface ImportExportControlsProps {
  onImport: (data: any[]) => void;
  onExport: (type: 'csv' | 'excel') => void;
  isImporting?: boolean;
}

export const ImportExportControls: React.FC<ImportExportControlsProps> = ({
  onImport,
  onExport,
  isImporting = false
}) => {
  const [importOpen, setImportOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setParsing(true);
      const { rows } = await parseImportFile(file);
      onImport(rows);
      setImportOpen(false);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to parse file');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4">
            {parsing || isImporting ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                   {parsing ? 'Parsing file...' : 'Importing data...'}
                </p>
              </div>
            ) : (
              <>
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports .csv, .xlsx, .xls
                  </p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground text-center max-w-[80%]">
                  Note: Importing will replace/update cells based on row order.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('csv')}>
            <FileText className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
