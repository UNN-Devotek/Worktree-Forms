'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from '@/lib/i18n';

interface User {
  id: string;
  name: string;
  color: string;
  image?: string;
}

interface RowAssignmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userId: string) => void;
  users: User[];
  assignedUserId?: string;
}

/**
 * Finding #8 (R8): Replaced hand-rolled positioned div with Radix DropdownMenu.
 * Gains: focus trap, ESC to close, click-outside close, keyboard navigation,
 * correct ARIA roles, screen-reader support — all for free.
 */
export const RowAssignmentMenu: React.FC<RowAssignmentMenuProps> = ({
  isOpen,
  onClose,
  onAssign,
  users,
  assignedUserId
}) => {
  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Hidden trigger — the menu is opened programmatically via isOpen */}
      <DropdownMenuTrigger asChild>
        <span />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{t('assign.title', 'Row Actions')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {t('assign.assign_to', 'Assign to:')}
        </DropdownMenuLabel>
        {users.map(user => (
          <DropdownMenuItem
            key={user.id}
            className={assignedUserId === user.id ? 'bg-accent/50' : ''}
            onClick={() => {
              onAssign(user.id);
              onClose();
            }}
          >
            <div className="flex items-center gap-2 w-full">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                style={{ backgroundColor: user.color }}
              >
                {user.name[0]}
              </div>
              <span>{user.name}</span>
              {assignedUserId === user.id && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {assignedUserId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                onAssign('');
                onClose();
              }}
            >
              {t('assign.unassign', 'Unassign')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
