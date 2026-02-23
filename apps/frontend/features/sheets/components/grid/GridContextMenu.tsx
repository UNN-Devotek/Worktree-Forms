'use client';

import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import { useSheet } from '../../providers/SheetProvider';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  Eraser,
  ArrowUp,
  ArrowDown,
  Trash2,
  CopyPlus,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Pencil,
  ArrowUpAZ,
  ArrowDownAZ,
  EyeOff,
  Eye,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// CellContextMenu — right-click on a data row
// ---------------------------------------------------------------------------

interface CellContextMenuProps {
  rowId: string;
  children: React.ReactNode;
}

export function CellContextMenu({ rowId, children }: CellContextMenuProps) {
  const {
    deleteRow,
    addRow,
    insertRowAbove,
    duplicateRow,
    clearRowCells,
    copiedRow,
    copyRow,
    cutRow,
    pasteRowAfter,
    openDetailPanel,
  } = useSheet();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Clipboard actions */}
        <ContextMenuItem onSelect={() => cutRow(rowId)}>
          <Scissors className="mr-2 h-4 w-4" />
          Cut
          <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => copyRow(rowId)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => pasteRowAfter(rowId)}
          disabled={copiedRow === null}
        >
          <ClipboardPaste className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => clearRowCells(rowId)}>
          <Eraser className="mr-2 h-4 w-4" />
          Clear Contents
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Row operations */}
        <ContextMenuItem onSelect={() => insertRowAbove(rowId)}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Insert Row Above
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => addRow({
          id: crypto.randomUUID(),
          parentId: null,
        }, rowId)}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Insert Row Below
        </ContextMenuItem>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => deleteRow(rowId)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Row
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => duplicateRow(rowId)}>
          <CopyPlus className="mr-2 h-4 w-4" />
          Duplicate Row
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Detail / Comment */}
        <ContextMenuItem onSelect={() => openDetailPanel(rowId)}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Add Comment...
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ---------------------------------------------------------------------------
// ColumnContextMenu — right-click on a column header
// ---------------------------------------------------------------------------

interface ColumnContextMenuProps {
  columnId: string;
  children: React.ReactNode;
}

export function ColumnContextMenu({ columnId, children }: ColumnContextMenuProps) {
  const {
    deleteColumn,
    insertColumnLeft,
    insertColumnRight,
    renameColumn,
    sortRows,
    hideColumn,
    unhideAllColumns,
  } = useSheet();

  const handleRename = () => {
    const newName = window.prompt('Enter new column name:');
    if (newName && newName.trim()) {
      renameColumn(columnId, newName.trim());
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {/* Column insert/delete */}
        <ContextMenuItem onSelect={() => insertColumnLeft(columnId)}>
          <PanelLeft className="mr-2 h-4 w-4" />
          Insert Column Left
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => insertColumnRight(columnId)}>
          <PanelRight className="mr-2 h-4 w-4" />
          Insert Column Right
        </ContextMenuItem>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => deleteColumn(columnId)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Column
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename Column...
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Sort */}
        <ContextMenuItem onSelect={() => sortRows(columnId, 'asc')}>
          <ArrowUpAZ className="mr-2 h-4 w-4" />
          Sort A &rarr; Z
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => sortRows(columnId, 'desc')}>
          <ArrowDownAZ className="mr-2 h-4 w-4" />
          Sort Z &rarr; A
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Visibility */}
        <ContextMenuItem onSelect={() => hideColumn(columnId)}>
          <EyeOff className="mr-2 h-4 w-4" />
          Hide Column
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => unhideAllColumns()}>
          <Eye className="mr-2 h-4 w-4" />
          Unhide All Columns
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
