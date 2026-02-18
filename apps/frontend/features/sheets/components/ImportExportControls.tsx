'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { parseImportFile } from '@/lib/import-export.utils';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

// Finding #9 (R4): max import file size (10MB) to prevent browser tab crash
const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    // Finding #9 (R4): file size validation
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      toast.error(
        t('import.file_too_large',
          `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`)
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setParsing(true);
      const { rows } = await parseImportFile(file);
      onImport(rows);
      setImportOpen(false);
      toast.success(t('import.success', `Imported ${rows.length} rows successfully.`));
    } catch (error) {
      console.error('Import failed:', error);
      // Finding #9 (R4): replaced alert() with toast
      toast.error(t('import.failed', 'Failed to parse file. Please check the format and try again.'));
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
            {t('import.button', 'Import')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('import.dialog_title', 'Import Data')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4">
            {parsing || isImporting ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                   {parsing
                     ? t('import.parsing', 'Parsing file...')
                     : t('import.importing', 'Importing data...')}
                </p>
              </div>
            ) : (
              <>
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {t('import.instructions', 'Click to upload or drag and drop')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('import.supported_formats', 'Supports .csv, .xlsx, .xls (max 10MB)')}
                  </p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  {t('import.select_file', 'Select File')}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                  aria-label={t('import.file_input', 'Upload spreadsheet file')}
                />
                <p className="text-xs text-muted-foreground text-center max-w-[80%]">
                  {t('import.note', 'Note: Importing will replace/update cells based on row order.')}
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
            {t('export.button', 'Export')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {t('export.excel', 'Export as Excel (.xlsx)')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('csv')}>
            <FileText className="mr-2 h-4 w-4" />
            {t('export.csv', 'Export as CSV')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
