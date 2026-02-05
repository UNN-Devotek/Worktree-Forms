'use client';

import React from 'react';
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
  Trello
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
import { WrapToggle } from '../toolbar/WrapToggle';
import { FilterModal } from '../filters/FilterModal';

interface SheetToolbarProps {
  title: string;
}

export function SheetToolbar({ title }: SheetToolbarProps) {
  const { addRow, indentRow, outdentRow, selectedRowId, activeView, setActiveView } = useSheet();

  const handleAddRow = () => {
    addRow({
      id: `row-${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Task',
      status: 'Planned',
      assignee: 'Unassigned',
    });
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
          <div className="relative w-48 hidden lg:block">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input 
              placeholder="Search sheet..." 
              className="h-8 pl-7 text-xs bg-muted/50 border-none focus-visible:ring-1" 
            />
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
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}