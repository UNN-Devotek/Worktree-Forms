'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Indent,
  Outdent,
  Search,
  ArrowUpDown,
  Share2,
  Settings,
  Grid3X3,
  Calendar,
  LayoutList,
  Trello,
  ChevronUp,
  ChevronDown,
  X,
  ArrowUp,
  ArrowDown,
  Check,
  MoreHorizontal,
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  Star,
  ListFilter,
  History,
  Save,
  Printer,
  Undo2,
  Redo2,
  ImagePlus,
  Link2,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AddColumnDialog } from '../controls/ColumnManagerDialog';
import { useSheet } from '../../providers/SheetProvider';
import { t } from '@/lib/i18n';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ShareModal } from '../modals/ShareModal';
import { exportToCsv, exportToExcel, parseImportFile } from '@/lib/import-export.utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Toolbar sub-components
import { TextFormattingToolbar } from '../toolbar/TextFormattingToolbar';
import { AlignmentSelector } from '../toolbar/AlignmentSelector';
import { ColorPicker } from '../toolbar/ColorPicker';
import { WrapToggle } from '../toolbar/WrapToggle';
import { FontFamilySelector } from '../toolbar/FontFamilySelector';
import { FontSizeSelector } from '../toolbar/FontSizeSelector';
import { BackgroundColorPicker } from '../toolbar/BackgroundColorPicker';
import { ClearFormatting } from '../toolbar/ClearFormatting';
import { FormatPainter } from '../toolbar/FormatPainter';
import { FilterModal } from '../filters/FilterModal';
import { SettingsModal, SheetSettings } from '../modals/SettingsModal';
import { ConditionalFormattingModal } from '../modals/ConditionalFormattingModal';
import { HighlightChangesModal } from '../modals/HighlightChangesModal';
import { AddRowIcon, AddColumnIcon } from '../icons/SheetIcons';

// ---------------------------------------------------------------------------
// View options
// ---------------------------------------------------------------------------

type ViewType = 'GRID' | 'GANTT' | 'CALENDAR' | 'CARD';

const VIEW_OPTIONS: { value: ViewType; label: string; icon: React.ElementType }[] = [
  { value: 'GRID',     label: 'Grid',     icon: Grid3X3   },
  { value: 'GANTT',    label: 'Gantt',    icon: LayoutList },
  { value: 'CALENDAR', label: 'Calendar', icon: Calendar   },
  { value: 'CARD',     label: 'Card',     icon: Trello     },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SheetToolbarProps {
  title: string;
  onTitleChange?: (title: string) => void;
}

interface SearchResult {
  rowId: string;
  columnId: string;
  value: string;
  cellKey: string;
}

// ---------------------------------------------------------------------------
// SheetToolbar
// ---------------------------------------------------------------------------

export function SheetToolbar({ title, onTitleChange }: SheetToolbarProps) {
  const {
    addRow, indentRow, outdentRow, selectedRowId,
    activeView, setActiveView,
    doc, setFocusedCell,
    columns, data,
    setSelectedColumnIds, setSelectedFormattingRowIds,
    undo, redo, canUndo, canRedo,
    focusedCell, updateCell,
  } = useSheet();

  // ---- title editing --------------------------------------------------------
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [isFavorite, setIsFavorite] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitleDraft(title); }, [title]);

  const commitTitleEdit = () => {
    const trimmed = titleDraft.trim() || title;
    setTitleDraft(trimmed);
    setTitleEditing(false);
    if (trimmed !== title) onTitleChange?.(trimmed);
  };

  // ---- search ---------------------------------------------------------------
  const [searchQuery,       setSearchQuery      ] = useState('');
  const [searchResults,     setSearchResults    ] = useState<SearchResult[]>([]);
  const [currentSearchIndex,setCurrentSearchIndex] = useState(-1);
  const [searchVisible,     setSearchVisible    ] = useState(false);

  // ---- settings -------------------------------------------------------------
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conditionalFormattingOpen, setConditionalFormattingOpen] = useState(false);
  const [highlightChangesOpen, setHighlightChangesOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [settings, setSettings] = useState<SheetSettings>({
    defaultColumnWidth: 120,
    rowHeight: 'normal',
    autoSaveInterval: '5min',
    theme: 'system',
  });

  // ---- import ---------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // ---- image insert ---------------------------------------------------------
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // ---- link insert ----------------------------------------------------------
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // ---- derived --------------------------------------------------------------
  const currentView    = VIEW_OPTIONS.find(v => v.value === activeView) ?? VIEW_OPTIONS[0];
  const CurrentViewIcon = currentView.icon;

  // ---------------------------------------------------------------------------
  // Search handlers
  // ---------------------------------------------------------------------------

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !doc) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results: SearchResult[] = [];
    const yRows  = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const lower  = query.toLowerCase();

    for (const rowId of yOrder.toArray() as string[]) {
      const row = yRows.get(rowId) as any;
      if (!row) continue;
      for (const col of columns) {
        const val = row[col.id] != null ? String(row[col.id]) : '';
        if (val.toLowerCase().includes(lower)) {
          results.push({ rowId, columnId: col.id, value: val, cellKey: `${rowId}:${col.id}` });
        }
      }
    }

    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      setFocusedCell({ rowId: results[0].rowId, columnId: results[0].columnId });
    } else {
      setCurrentSearchIndex(-1);
    }
  }, [doc, columns, setFocusedCell]);

  const handlePreviousResult = useCallback(() => {
    if (!searchResults.length) return;
    const idx = currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(idx);
    setFocusedCell({ rowId: searchResults[idx].rowId, columnId: searchResults[idx].columnId });
  }, [searchResults, currentSearchIndex, setFocusedCell]);

  const handleNextResult = useCallback(() => {
    if (!searchResults.length) return;
    const idx = currentSearchIndex >= searchResults.length - 1 ? 0 : currentSearchIndex + 1;
    setCurrentSearchIndex(idx);
    setFocusedCell({ rowId: searchResults[idx].rowId, columnId: searchResults[idx].columnId });
  }, [searchResults, currentSearchIndex, setFocusedCell]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.shiftKey ? handlePreviousResult() : handleNextResult();
    } else if (e.key === 'Escape') {
      handleClearSearch();
      setSearchVisible(false);
    }
  }, [handlePreviousResult, handleNextResult, handleClearSearch]);

  // ---------------------------------------------------------------------------
  // Row handlers
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Import / Export
  // ---------------------------------------------------------------------------

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(t('import.too_large', 'File too large (max 10 MB)'));
      return;
    }

    setImporting(true);
    try {
      const { rows } = await parseImportFile(file);
      if (rows.length === 0) { toast.warning(t('import.empty', 'No rows found in file')); return; }

      const importedHeaders = Object.keys(rows[0]);
      const columnLabels    = new Set(columns.map((col: any) => col.label || col.id));
      const unmatched       = importedHeaders.filter(h => !columnLabels.has(h));

      for (const importedRow of rows) {
        const newRow: any = { id: crypto.randomUUID(), parentId: null };
        for (const col of columns) {
          const label = col.label || col.id;
          if (importedRow[label] !== undefined) newRow[col.id] = importedRow[label];
        }
        addRow(newRow);
      }

      if (unmatched.length > 0) {
        toast.warning(`${unmatched.length} column(s) skipped: ${unmatched.slice(0, 5).join(', ')}${unmatched.length > 5 ? '…' : ''}`);
      } else {
        toast.success(t('import.success', `Imported ${rows.length} rows`));
      }
    } catch (err: any) {
      toast.error(`Import failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setImporting(false);
      setSelectedColumnIds(new Set());
      setSelectedFormattingRowIds(new Set());
      e.target.value = '';
    }
  }, [columns, addRow, setSelectedColumnIds, setSelectedFormattingRowIds]);

  const handleExport = useCallback((type: 'csv' | 'excel') => {
    const exportData = data.map((row: any) => {
      const out: any = {};
      for (const col of columns) out[col.label || col.id] = row[col.id] ?? '';
      return out;
    });
    type === 'csv' ? exportToCsv(exportData, title || 'sheet') : exportToExcel(exportData, title || 'sheet');
  }, [data, columns, title]);

  // ---------------------------------------------------------------------------
  // Image insert
  // ---------------------------------------------------------------------------

  const handleImageFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !focusedCell) return;
    e.target.value = '';

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldName', 'sheet-image');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Upload failed');

      const url: string = json.data.url;

      // Detect natural dimensions then cap at 400px
      const img = new window.Image();
      img.onload = () => {
        const MAX = 400;
        const w = Math.min(img.naturalWidth || MAX, MAX);
        const h = img.naturalWidth
          ? Math.round(w * (img.naturalHeight / img.naturalWidth))
          : Math.round(w * 0.75);
        updateCell(focusedCell.rowId, focusedCell.columnId, `__img__${JSON.stringify({ url, width: w, height: h })}`);
      };
      img.onerror = () => {
        updateCell(focusedCell.rowId, focusedCell.columnId, `__img__${JSON.stringify({ url, width: 200, height: 150 })}`);
      };
      img.src = url;
    } catch (err: any) {
      toast.error(`Image upload failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setImageUploading(false);
    }
  }, [focusedCell, updateCell]);

  // ---------------------------------------------------------------------------
  // Link insert
  // ---------------------------------------------------------------------------

  const handleInsertLink = useCallback(() => {
    if (!focusedCell || !linkUrl.trim()) return;
    const safe = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    updateCell(focusedCell.rowId, focusedCell.columnId, `__link__${JSON.stringify({ url: safe, text: linkText.trim() })}`);
    setLinkPopoverOpen(false);
    setLinkUrl('');
    setLinkText('');
  }, [focusedCell, linkUrl, linkText, updateCell]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TooltipProvider>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
      />

      {/* Hidden file input for image insert */}
      <input
        ref={imageFileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageFileChange}
      />

      {/* ── Row 1: title bar ─────────────────────────────────────────────── */}
      <div className="relative flex items-center px-2 h-9 border-b border-table-border bg-table-toolbar shrink-0">
        {/* Left: menu dropdowns */}
        <div className="flex items-center gap-0.5">
          {/* File */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-normal gap-0.5">
                File <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                Import CSV / Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 cursor-pointer">
                <Download className="h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()} className="gap-2 cursor-pointer">
                <Printer className="h-4 w-4" />
                Print
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Automation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-normal gap-0.5">
                Automation <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Automation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">Coming soon</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Forms */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-normal gap-0.5">
                Forms <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Forms</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">Coming soon</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Connections */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-normal gap-0.5">
                Connections <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Connections</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">Coming soon</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dynamic View */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-normal gap-0.5">
                Dynamic View <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Dynamic View</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">Coming soon</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center: sheet name (absolutely centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 max-w-[40%]">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsFavorite(f => !f)}
                className={cn(
                  "h-6 w-6 flex items-center justify-center rounded transition-colors hover:bg-muted/50 shrink-0",
                  isFavorite ? "text-yellow-400" : "text-muted-foreground"
                )}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-yellow-400")} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
            </TooltipContent>
          </Tooltip>
          {titleEditing ? (
            <input
              ref={titleInputRef}
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={commitTitleEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); commitTitleEdit(); titleInputRef.current?.blur(); }
                if (e.key === 'Escape') { setTitleDraft(title); setTitleEditing(false); }
              }}
              className="font-semibold text-sm bg-transparent border-0 border-b border-primary outline-none focus:outline-none text-center min-w-[60px] max-w-[280px] w-auto"
              style={{ width: `${Math.max(60, titleDraft.length * 8)}px` }}
            />
          ) : (
            <button
              onClick={() => { setTitleEditing(true); setTitleDraft(title); }}
              className="font-semibold text-sm truncate hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors cursor-text max-w-[240px]"
              title="Click to rename"
            >
              {title}
            </button>
          )}
        </div>

        {/* Right: share button */}
        <div className="flex items-center ml-auto">
          <ShareModal>
            <Button size="sm" className="h-7 px-3 text-xs gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              {t('toolbar.share', 'Share')}
            </Button>
          </ShareModal>
        </div>
      </div>

      {/* ── Row 2: dense toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center px-2 h-10 border-b border-table-border bg-table-toolbar shrink-0 gap-0.5 overflow-hidden">

        {/* Save / Print / Undo / Redo ──────────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => toast.success('Saved')}>
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Save</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Print</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={undo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Undo</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={redo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Redo</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 shrink-0 mx-0.5" />

        {/* View dropdown ───────────────────────────────────────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 shrink-0 font-normal">
              <CurrentViewIcon className="h-4 w-4" />
              <span className="text-xs">{currentView.label}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {VIEW_OPTIONS.map(v => (
              <DropdownMenuItem key={v.value} onClick={() => setActiveView(v.value)} className="gap-2 cursor-pointer">
                <v.icon className="h-4 w-4" />
                <span>{v.label}</span>
                {activeView === v.value && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-5 shrink-0 mx-0.5" />

        {/* Add Row / Add Column ────────────────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => addRow({ id: crypto.randomUUID(), parentId: null })}
            >
              <AddRowIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Add Row</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setAddColumnOpen(true)}
            >
              <AddColumnIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Add Column</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 shrink-0 mx-0.5" />

        {/* Filter ─────────────────────────────────────────────────────── */}
        <div className="shrink-0"><FilterModal /></div>

        {/* Sort ── hidden below sm ─────────────────────────────────────── */}
        <div className="hidden sm:block shrink-0"><SortPopover /></div>

        <Separator orientation="vertical" className="h-5 hidden sm:block shrink-0 mx-0.5" />

        {/* Indent / Outdent ── hidden below sm ───────────────────────── */}
        <div className="hidden sm:flex items-center shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => selectedRowId && outdentRow(selectedRowId)} disabled={!selectedRowId}>
                <Outdent className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Outdent row</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => selectedRowId && indentRow(selectedRowId)} disabled={!selectedRowId}>
                <Indent className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Indent row</p></TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 hidden sm:block shrink-0 mx-0.5" />

        {/* Text formatting ── hidden below sm ────────────────────────── */}
        <div className="hidden sm:flex items-center shrink-0">
          <TextFormattingToolbar />
          <FontFamilySelector />
          <FontSizeSelector />
        </div>

        <Separator orientation="vertical" className="h-5 hidden md:block shrink-0 mx-0.5" />

        {/* Color / Alignment / Wrap / Format ── hidden below md ────────────────── */}
        <div className="hidden md:flex items-center shrink-0">
          <AlignmentSelector />
          <BackgroundColorPicker />
          <ColorPicker />
          <WrapToggle />
          <ClearFormatting />
          <FormatPainter />
        </div>

        <Separator orientation="vertical" className="h-5 hidden md:block shrink-0 mx-0.5" />

        {/* Insert Image / Link ─────────────────────────────────────────── */}
        <div className="hidden md:flex items-center shrink-0">
          {/* Insert Image */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!focusedCell || imageUploading}
                onClick={() => imageFileInputRef.current?.click()}
              >
                {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Insert Image</p></TooltipContent>
          </Tooltip>

          {/* Insert Link */}
          <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!focusedCell}
                    onClick={() => { setLinkUrl(''); setLinkText(''); }}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Insert Link</p></TooltipContent>
            </Tooltip>
            <PopoverContent className="w-72 p-3 space-y-2" align="start">
              <p className="text-sm font-medium">Insert Link</p>
              <Input
                placeholder="URL (e.g. https://example.com)"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleInsertLink(); }}
                autoFocus
              />
              <Input
                placeholder="Display text (optional)"
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleInsertLink(); }}
              />
              <Button
                size="sm"
                className="w-full"
                disabled={!linkUrl.trim()}
                onClick={handleInsertLink}
              >
                Insert
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <Separator orientation="vertical" className="h-5 hidden md:block shrink-0 mx-0.5" />

        {/* Conditional Formatting ─────────────────────────────────────── */}
        <div className="hidden md:flex items-center shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setConditionalFormattingOpen(true)}
              >
                <ListFilter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Conditional Formatting</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Highlight Changes ───────────────────────────────────────────── */}
        <div className="hidden md:flex items-center shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setHighlightChangesOpen(true)}
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Highlight Changes</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Spacer ─────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0" />

        {/* Search ── always visible as icon; expands on click ─────────── */}
        <div className="shrink-0 flex items-center">
          {searchVisible ? (
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t('toolbar.search_sheet', 'Search…')}
                  className={cn(
                    'h-8 pl-7 text-xs bg-muted/50 border-none focus-visible:ring-1 transition-all',
                    searchResults.length > 0 ? 'w-36 pr-2' : 'w-40 pr-7',
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="flex items-center gap-0.5 bg-muted/50 rounded px-1.5 h-8">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {currentSearchIndex + 1}/{searchResults.length}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePreviousResult}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNextResult}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSearchVisible(false); handleClearSearch(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchVisible(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>{t('toolbar.search_sheet', 'Search sheet')}</p></TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ··· overflow menu ─────────────────────────────────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              {importing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <MoreHorizontal className="h-4 w-4" />
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t('toolbar.more_actions', 'More Actions')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Sort — always available in overflow */}
            <SortMenuItem />

          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Settings modal */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={s => { setSettings(s); }}
      />

      {/* Conditional Formatting modal */}
      <ConditionalFormattingModal
        open={conditionalFormattingOpen}
        onOpenChange={setConditionalFormattingOpen}
      />

      {/* Highlight Changes modal */}
      <HighlightChangesModal
        open={highlightChangesOpen}
        onOpenChange={setHighlightChangesOpen}
      />

      {/* Add Column dialog */}
      <AddColumnDialog
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
      />
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// SortPopover — toolbar button version
// ---------------------------------------------------------------------------

function SortPopover() {
  const { columns, sortRows } = useSheet();
  const [sortColumn,    setSortColumn   ] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [open,          setOpen         ] = useState(false);

  const handleApply = () => {
    if (sortColumn) { sortRows(sortColumn, sortDirection); setOpen(false); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 font-normal">
          <ArrowUpDown className="h-4 w-4" />
          <span className="text-xs">{t('toolbar.sort', 'Sort')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        <SortContent
          columns={columns}
          sortColumn={sortColumn}
          setSortColumn={setSortColumn}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          onApply={handleApply}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// SortMenuItem — overflow menu version of sort (opens its own Popover)
// ---------------------------------------------------------------------------

function SortMenuItem() {
  const { columns, sortRows } = useSheet();
  const [sortColumn,    setSortColumn   ] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [open,          setOpen         ] = useState(false);

  const handleApply = () => {
    if (sortColumn) { sortRows(sortColumn, sortDirection); setOpen(false); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Must use onSelect with e.preventDefault to keep dropdown from closing */}
        <DropdownMenuItem
          onSelect={e => { e.preventDefault(); setOpen(true); }}
          className="gap-2 cursor-pointer"
        >
          <ArrowUpDown className="h-4 w-4" />
          {t('toolbar.sort', 'Sort')}
        </DropdownMenuItem>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" side="left" align="start">
        <SortContent
          columns={columns}
          sortColumn={sortColumn}
          setSortColumn={setSortColumn}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          onApply={handleApply}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// SortContent — shared UI for both sort entry-points
// ---------------------------------------------------------------------------

interface SortContentProps {
  columns: any[];
  sortColumn: string;
  setSortColumn: (v: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (v: 'asc' | 'desc') => void;
  onApply: () => void;
}

function SortContent({ columns, sortColumn, setSortColumn, sortDirection, setSortDirection, onApply }: SortContentProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t('toolbar.sort_rows', 'Sort Rows')}
      </p>
      <div className="space-y-1.5">
        <label className="text-xs font-medium">{t('toolbar.column', 'Column')}</label>
        <Select value={sortColumn} onValueChange={setSortColumn}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t('toolbar.select_column', 'Select column…')} />
          </SelectTrigger>
          <SelectContent>
            {columns.map(col => (
              <SelectItem key={col.id} value={col.id} className="text-xs">
                {col.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button variant={sortDirection === 'asc'  ? 'default' : 'outline'} size="sm" className="flex-1 h-8 gap-1 text-xs" onClick={() => setSortDirection('asc')}>
          <ArrowUp   className="h-3 w-3" /> A → Z
        </Button>
        <Button variant={sortDirection === 'desc' ? 'default' : 'outline'} size="sm" className="flex-1 h-8 gap-1 text-xs" onClick={() => setSortDirection('desc')}>
          <ArrowDown className="h-3 w-3" /> Z → A
        </Button>
      </div>
      <Button size="sm" className="w-full h-8 text-xs" onClick={onApply} disabled={!sortColumn}>
        {t('toolbar.apply_sort', 'Apply Sort')}
      </Button>
    </div>
  );
}
