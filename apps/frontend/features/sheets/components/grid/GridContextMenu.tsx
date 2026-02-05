'use client';

import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { useSheet } from '../../providers/SheetProvider';

interface GridContextMenuProps {
  children: React.ReactNode;
  rowId: string;
}

export function GridContextMenu({ children, rowId }: GridContextMenuProps) {
  const { deleteRow, addRow } = useSheet();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => addRow({ id: crypto.randomUUID() })}>
          Insert Row Below
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          className="text-destructive focus:text-destructive"
          onSelect={() => deleteRow(rowId)}
        >
          Delete Row
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
