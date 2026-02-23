'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Indent,
  Outdent,
  Search,
  ArrowUpDown,
  Share2,
  Download,
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
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ColumnManagerDialog } from '../controls/ColumnManagerDialog';
import { useSheet } from '../../providers/SheetProvider';
import { t } from '@/lib/i18n';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ShareModal } from '../modals/ShareModal';
import { ImportExportControls } from '../ImportExportControls';
import { exportToCsv, exportToExcel } from '@/lib/import-export.utils';
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

// Toolbar components
import { TextFormattingToolbar } from '../toolbar/TextFormattingToolbar';
import { AlignmentSelector } from '../toolbar/AlignmentSelector';
import { ColorPicker } from '../toolbar/ColorPicker';
import { WrapToggle } from '../toolbar/WrapToggle';
import { FilterModal } from '../filters/FilterModal';
import { SettingsModal, SheetSettings } from '../modals/SettingsModal';

interface SheetToolbarProps {
  title: string;
}

interface SearchResult {
  rowId: string;
  columnId: string;
  value: string;
  cellKey: string;
}

export function SheetToolbar({ title }: SheetToolbarProps) {
  const { addRow, indentRow, outdentRow, selectedRowId, activeView, setActiveView, doc, setFocusedCell, focusedCell, columns, data, setSelectedColumnId, setSelectedFormattingRowId } = useSheet();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SheetSettings>({
    defaultColumnWidth: 120,
    rowHeight: 'normal',
    autoSaveInterval: '5min',
    theme: 'system',
  });

  // Search through all cells in the Yjs document
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query.trim() || !doc) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results: SearchResult[] = [];
    // Finding #4 (R7): search `rows` map (user data), not `cells` map (style metadata).
    // The cells map is mostly empty unless cells have been styled.
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const lowerQuery = query.toLowerCase();

    const order = yOrder.toArray() as string[];
    for (const rowId of order) {
      const row = yRows.get(rowId) as any;
      if (!row) continue;
      for (const col of columns) {
        const cellValue = row[col.id];
        const valueStr = cellValue != null ? String(cellValue) : '';
        if (valueStr.toLowerCase().includes(lowerQuery)) {
          results.push({
            rowId,
            columnId: col.id,
            value: valueStr,
            cellKey: `${rowId}:${col.id}`,
          });
        }
      }
    }

    setSearchResults(results);

    // Jump to first result if available
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      setFocusedCell({ rowId: results[0].rowId, columnId: results[0].columnId });
    } else {
      setCurrentSearchIndex(-1);
    }
  }, [doc, columns, setFocusedCell]);

  // Navigate to previous search result
  const handlePreviousResult = useCallback(() => {
    if (searchResults.length === 0) return;

    const newIndex = currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(newIndex);
    setFocusedCell({
      rowId: searchResults[newIndex].rowId,
      columnId: searchResults[newIndex].columnId
    });
  }, [searchResults, currentSearchIndex, setFocusedCell]);

  // Navigate to next search result
  const handleNextResult = useCallback(() => {
    if (searchResults.length === 0) return;

    const newIndex = currentSearchIndex >= searchResults.length - 1 ? 0 : currentSearchIndex + 1;
    setCurrentSearchIndex(newIndex);
    setFocusedCell({
      rowId: searchResults[newIndex].rowId,
      columnId: searchResults[newIndex].columnId
    });
  }, [searchResults, currentSearchIndex, setFocusedCell]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  }, []);

  // Handle keyboard navigation in search
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePreviousResult();
      } else {
        handleNextResult();
      }
    } else if (e.key === 'Escape') {
      handleClearSearch();
    }
  }, [handlePreviousResult, handleNextResult, handleClearSearch]);

  const handleAddRow = () => {
    addRow({
      id: crypto.randomUUID(),
      title: t('sheet.new_task', 'New Task'),
      status: t('sheet.planned', 'Planned'),
      assignee: t('sheet.unassigned', 'Unassigned'),
    });
  };

  const handleSettingsChange = (newSettings: SheetSettings) => {
    setSettings(newSettings);
    console.log('Settings updated:', newSettings);
  };

  const handleImport = useCallback((rows: any[]) => {
    for (const importedRow of rows) {
      const newRow: any = { id: crypto.randomUUID(), parentId: null };
      for (const col of columns) {
        const label = col.label || col.id;
        if (importedRow[label] !== undefined) {
          newRow[col.id] = importedRow[label];
        }
      }
      addRow(newRow);
    }
    setSelectedColumnId(null);
    setSelectedFormattingRowId(null);
  }, [columns, addRow, setSelectedColumnId, setSelectedFormattingRowId]);

  const handleExport = useCallback((type: 'csv' | 'excel') => {
    const exportData = data.map((row: any) => {
      const exported: any = {};
      for (const col of columns) {
        exported[col.label || col.id] = row[col.id] ?? '';
      }
      return exported;
    });
    if (type === 'csv') {
      exportToCsv(exportData, title || 'sheet');
    } else {
      exportToExcel(exportData, title || 'sheet');
    }
  }, [data, columns, title]);

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-4 h-12 border-b bg-muted/50 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <h2 className="font-semibold text-sm truncate mr-2">{title}</h2>

          {/* Focused Cell Indicator */}
          {focusedCell && columns && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
              <span>{columns.find(c => c.id === focusedCell.columnId)?.label || focusedCell.columnId}</span>
            </div>
          )}

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Row Controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" onClick={handleAddRow}>
              <Plus className="h-4 w-4" />
              <span className="text-xs">{t('toolbar.add_row', 'Add Row')}</span>
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => selectedRowId && outdentRow(selectedRowId)}
              disabled={!selectedRowId}
              aria-label="Outdent row"
            >
              <Outdent className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => selectedRowId && indentRow(selectedRowId)}
              disabled={!selectedRowId}
              aria-label="Indent row"
            >
              <Indent className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Formatting */}
          <TextFormattingToolbar />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment & Wrapping */}
          <AlignmentSelector />
          <ColorPicker />
          <WrapToggle />

          <Separator orientation="vertical" className="h-6 mx-1" />
          <ColumnManagerDialog />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* View Switcher */}
          <div className="flex items-center bg-muted/50 p-1 rounded-md shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 gap-1",
                activeView === 'GRID' && "bg-background shadow-sm text-primary"
              )}
              onClick={() => setActiveView('GRID')}
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="text-xs">{t('toolbar.grid', 'Grid')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 gap-1",
                activeView === 'GANTT' && "bg-background shadow-sm text-primary"
              )}
              onClick={() => setActiveView('GANTT')}
            >
              <LayoutList className="h-4 w-4" />
              <span className="text-xs">{t('toolbar.gantt', 'Gantt')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 gap-1",
                activeView === 'CALENDAR' && "bg-background shadow-sm text-primary"
              )}
              onClick={() => setActiveView('CALENDAR')}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{t('toolbar.calendar', 'Calendar')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 gap-1",
                activeView === 'CARD' && "bg-background shadow-sm text-primary"
              )}
              onClick={() => setActiveView('CARD')}
            >
              <Trello className="h-4 w-4" />
              <span className="text-xs">{t('toolbar.card', 'Card')}</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden lg:flex items-center gap-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('toolbar.search_sheet', 'Search sheet...')}
                className={cn(
                  "h-8 pl-7 text-xs bg-muted/50 border-none focus-visible:ring-1",
                  searchResults.length > 0 ? "w-44 pr-2" : "w-48 pr-8"
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

            {/* Search result count and navigation */}
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1 bg-muted/50 rounded-md px-2 h-8">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <div className="flex items-center gap-0.5 ml-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handlePreviousResult}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleNextResult}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Filter Modal */}
          <FilterModal />

          <SortPopover />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ShareModal>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">{t('toolbar.share', 'Share')}</span>
            </Button>
          </ShareModal>

          <ImportExportControls onImport={handleImport} onExport={handleExport} />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSettingsOpen(true)}
            aria-label="Sheet settings"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </TooltipProvider>
  );
}

function SortPopover() {
  const { columns, sortRows } = useSheet();
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    if (sortColumn) {
      sortRows(sortColumn, sortDirection);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">{t('toolbar.sort', 'Sort')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('toolbar.sort_rows', 'Sort Rows')}</p>
          <div className="space-y-2">
            <label className="text-xs font-medium">{t('toolbar.column', 'Column')}</label>
            <Select value={sortColumn} onValueChange={setSortColumn}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t('toolbar.select_column', 'Select column...')} />
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
            <Button
              variant={sortDirection === 'asc' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-8 gap-1 text-xs"
              onClick={() => setSortDirection('asc')}
            >
              <ArrowUp className="h-3 w-3" />
              A → Z
            </Button>
            <Button
              variant={sortDirection === 'desc' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-8 gap-1 text-xs"
              onClick={() => setSortDirection('desc')}
            >
              <ArrowDown className="h-3 w-3" />
              Z → A
            </Button>
          </div>
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleApply}
            disabled={!sortColumn}
          >
            {t('toolbar.apply_sort', 'Apply Sort')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
