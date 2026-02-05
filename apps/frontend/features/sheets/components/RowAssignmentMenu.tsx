import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  color: string;
  image?: string;
}

interface RowAssignmentMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAssign: (userId: string) => void;
  users: User[];
  assignedUserId?: string;
}

export const RowAssignmentMenu: React.FC<RowAssignmentMenuProps> = ({
  isOpen,
  position,
  onClose,
  onAssign,
  users,
  assignedUserId
}) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed z-50 bg-background border rounded-md shadow-md w-56"
        style={{ top: position.y, left: position.x }}
    >
        <div className="p-2 text-sm font-semibold border-b">Row Actions</div>
        <div className="p-1">
            <div className="text-xs text-muted-foreground px-2 py-1">Assign to:</div>
            {users.map(user => (
                <div 
                    key={user.id}
                    className={`flex items-center gap-2 px-2 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer text-sm ${assignedUserId === user.id ? 'bg-accent/50' : ''}`}
                    onClick={() => {
                        onAssign(user.id);
                        onClose();
                    }}
                >
                    <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white"
                        style={{ backgroundColor: user.color }}
                    >
                        {user.name[0]}
                    </div>
                    <span>{user.name}</span>
                    {assignedUserId === user.id && <span className="ml-auto text-xs">✓</span>}
                </div>
            ))}
            
            {assignedUserId && (
                <>
                    <div className="h-px bg-border my-1" />
                    <div 
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-destructive/10 hover:text-destructive rounded-sm cursor-pointer text-sm"
                        onClick={() => {
                            onAssign('');
                            onClose();
                        }}
                    >
                        Unassign
                    </div>
                </>
            )}
        </div>
        
        {/* Click outside to close - simple implementation handled by parent or backdrop */}
    </div>
  );
};
