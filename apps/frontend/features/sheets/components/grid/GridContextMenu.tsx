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
import { t } from '@/lib/i18n';

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
        <ContextMenuItem onSelect={() => addRow({
          id: crypto.randomUUID(),
          title: t('sheet.new_task', 'New Task'),
          status: t('sheet.planned', 'Planned'),
          assignee: t('sheet.unassigned', 'Unassigned'),
        }, rowId)}>
          {t('context.insert_below', 'Insert Row Below')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          className="text-destructive focus:text-destructive"
          onSelect={() => deleteRow(rowId)}
        >
          {t('context.delete_row', 'Delete Row')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
