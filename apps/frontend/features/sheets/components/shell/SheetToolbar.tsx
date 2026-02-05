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
  X
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ColumnManagerDialog } from '../controls/ColumnManagerDialog';
import { useSheet } from '../../providers/SheetProvider';
import { TooltipProvider } from '@/components/ui/tooltip';

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
  const { addRow, indentRow, outdentRow, selectedRowId, activeView, setActiveView, doc, setFocusedCell } = useSheet();

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
    const cellsMap = doc.getMap('cells');
    const lowerQuery = query.toLowerCase();

    // Iterate through all cells
    cellsMap.forEach((cell: { value?: unknown; type?: string; style?: Record<string, unknown> }, cellKey: string) => {
      const cellValue = cell?.value;

      // Convert cell value to string for searching
      const valueStr = cellValue != null ? String(cellValue) : '';

      // Check if the value contains the search query (case-insensitive)
      if (valueStr.toLowerCase().includes(lowerQuery)) {
        const [rowId, columnId] = cellKey.split(':');
        results.push({
          rowId,
          columnId,
          value: valueStr,
          cellKey
        });
      }
    });

    setSearchResults(results);

    // Jump to first result if available
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      setFocusedCell({ rowId: results[0].rowId, columnId: results[0].columnId });
    } else {
      setCurrentSearchIndex(-1);
    }
  }, [doc, setFocusedCell]);

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
      id: `row-${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Task',
      status: 'Planned',
      assignee: 'Unassigned',
    });
  };

  const handleSettingsChange = (newSettings: SheetSettings) => {
    setSettings(newSettings);
    // TODO: Apply settings (e.g., update column widths, row heights)
    // TODO: Consider persisting to localStorage
    console.log('Settings updated:', newSettings);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-4 h-12 border-b bg-muted/50 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <h2 className="font-semibold text-sm truncate mr-4">{title}</h2>
          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Row Controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" onClick={handleAddRow}>
              <Plus className="h-4 w-4" />
              <span className="text-xs">Add Row</span>
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => selectedRowId && outdentRow(selectedRowId)}
              disabled={!selectedRowId}
            >
              <Outdent className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => selectedRowId && indentRow(selectedRowId)}
              disabled={!selectedRowId}
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
              <span className="text-xs">Grid</span>
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
              <span className="text-xs">Gantt</span>
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
              <span className="text-xs">Calendar</span>
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
              <span className="text-xs">Card</span>
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
                placeholder="Search sheet..."
                className={cn(
                  "h-8 pl-7 text-xs bg-muted/50 border-none focus-visible:ring-1",
                  searchResults.length > 0 ? "w-44 pr-2" : "w-48 pr-8"
                )}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
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

          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">Sort</span>
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">Share</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">Export</span>
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSettingsOpen(true)}
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
