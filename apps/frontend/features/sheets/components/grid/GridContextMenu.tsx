'use client';

import React, { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSheet } from '../../providers/SheetProvider';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  Eraser,
  Trash2,
  CopyPlus,
  MessageSquare,
  Pencil,
  ArrowUpAZ,
  ArrowDownAZ,
  EyeOff,
  Eye,
  Settings,
} from 'lucide-react';
import { AddColumnDialog, type EditableColumn } from '../controls/ColumnManagerDialog';
import { AddRowIcon, AddColumnIcon } from '../icons/SheetIcons';

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
          <AddRowIcon className="mr-2 h-4 w-4" />
          Insert Row Above
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => addRow({
          id: crypto.randomUUID(),
          parentId: null,
        }, rowId)}>
          <AddRowIcon className="mr-2 h-4 w-4" />
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
  column: EditableColumn;
  children: React.ReactNode;
}

export function ColumnContextMenu({ columnId, column, children }: ColumnContextMenuProps) {
  const {
    deleteColumn,
    insertColumnLeft,
    insertColumnRight,
    renameColumn,
    sortRows,
    hideColumn,
    unhideAllColumns,
  } = useSheet();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const openRenameDialog = () => {
    setRenameValue('');
    setRenameOpen(true);
  };

  const commitRename = () => {
    if (renameValue.trim()) {
      renameColumn(columnId, renameValue.trim());
    }
    setRenameOpen(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          {/* Column insert/delete */}
          <ContextMenuItem onSelect={() => insertColumnLeft(columnId)}>
            <AddColumnIcon className="mr-2 h-4 w-4" />
            Insert Column Left
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => insertColumnRight(columnId)}>
            <AddColumnIcon className="mr-2 h-4 w-4" />
            Insert Column Right
          </ContextMenuItem>
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => deleteColumn(columnId)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Column
          </ContextMenuItem>
          <ContextMenuItem onSelect={openRenameDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename Column...
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setEditOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Column...
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Sort */}
          <ContextMenuItem onSelect={() => sortRows(columnId, 'asc')}>
            <ArrowUpAZ className="mr-2 h-4 w-4" />
            Sort A → Z
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => sortRows(columnId, 'desc')}>
            <ArrowDownAZ className="mr-2 h-4 w-4" />
            Sort Z → A
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

      {/* Rename dialog — rendered outside the ContextMenu to avoid portal conflicts */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Column</DialogTitle>
            <DialogDescription>
              Enter a new name for this column.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="col-rename-input" className="sr-only">
              Column name
            </Label>
            <Input
              id="col-rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenameOpen(false);
              }}
              placeholder="New column name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={commitRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column dialog */}
      <AddColumnDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editColumn={column}
      />
    </>
  );
}
