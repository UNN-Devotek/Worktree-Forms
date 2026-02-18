
import React, { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { t } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionInboxProps {
  doc: Y.Doc | null;
  currentUser: { id: string; name: string };
}

/**
 * Finding #5 (R9): Replaced hand-rolled dropdown with Radix DropdownMenu.
 * Gains: focus trap, ESC to close, click-outside close, keyboard navigation,
 * correct ARIA roles (`role="menu"` / `role="menuitem"`), screen-reader support.
 */
export const ActionInbox: React.FC<ActionInboxProps> = ({ doc, currentUser }) => {
  const [assignments, setAssignments] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!doc) return;

    const assignmentsMap = doc.getMap('assignments');

    const updateAssignments = () => {
      const myAssignments: string[] = [];
      assignmentsMap.forEach((userId, key) => {
        if (userId === currentUser.id) {
            myAssignments.push(key); 
        }
      });
      setAssignments(myAssignments);
    };

    assignmentsMap.observe(updateAssignments);
    updateAssignments();

    return () => {
      assignmentsMap.unobserve(updateAssignments);
    };
  }, [doc, currentUser.id]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t('inbox.button', 'Inbox')}
          </span>
          {assignments.length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
              {assignments.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          {t('inbox.title', 'My Action Items')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {assignments.length === 0 ? (
          <div className="text-xs text-zinc-500 text-center py-3 px-2">
            {t('inbox.empty', 'No assigned tasks.')}
          </div>
        ) : (
          assignments.map((key) => {
            const [_sheetIndex, rowIndex] = key.split('_');
            return (
              <DropdownMenuItem key={key} className="flex flex-col items-start gap-0.5">
                <span className="font-medium text-sm">
                  {t('inbox.row_label', `Row ${parseInt(rowIndex) + 1}`)}
                </span>
                <span className="text-xs text-zinc-500">
                  {t('inbox.assigned', 'Assigned to you')}
                </span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
