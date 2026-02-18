'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { TableCell } from '@/components/ui/table';
import { useSheet } from '../../providers/SheetProvider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Check, Pencil, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// Finding #6 (R9): Extracted to module-level so they're not recreated every render,
// and can be overridden via props when column metadata provides custom options.
const DEFAULT_STATUS_OPTIONS = ['Planned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'] as const;
const DEFAULT_STATUS_COLORS: Record<string, string> = {
  'Planned': 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  'Completed': 'bg-green-500',
  'On Hold': 'bg-gray-500',
  'Cancelled': 'bg-red-500',
};

interface EditableCellProps {
  rowId: string;
  columnId: string;
  value: any;
  columnType?: string;
  isFocused: boolean;
  onFocus: () => void;
  onUpdate: (value: any) => void;
  /** Finding #6 (R9): optional custom status list from column metadata */
  statusOptions?: string[];
}

export function EditableCell({
  rowId,
  columnId,
  value,
  columnType = 'TEXT',
  isFocused,
  onFocus,
  onUpdate,
  statusOptions: customStatusOptions
}: EditableCellProps) {
  const { getCellStyle } = useSheet();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Finding #3 (R8): track justSaved timer for cleanup on unmount.
  const justSavedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const statusDropdownRef = useRef<HTMLTableCellElement>(null);

  const style = getCellStyle(rowId, columnId);

  // Helper to safely set justSaved with tracked timer
  const showJustSaved = useCallback(() => {
    setJustSaved(true);
    if (justSavedTimerRef.current) clearTimeout(justSavedTimerRef.current);
    justSavedTimerRef.current = setTimeout(() => setJustSaved(false), 1000);
  }, []);

  // Debounced update for text inputs (300ms delay)
  const debouncedUpdate = useDebouncedCallback(
    (newValue) => {
      onUpdate(newValue);
      setIsSaving(false);
      showJustSaved();
    },
    300
  );

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Cleanup: flush pending updates and clear timers on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.flush();
      if (justSavedTimerRef.current) clearTimeout(justSavedTimerRef.current);
    };
  }, [debouncedUpdate]);

  useEffect(() => {
    if (isEditing && inputRef.current && columnType !== 'CHECKBOX' && columnType !== 'DATE') {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, columnType]);


  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  // Finding #7 (R9): Moved before early returns so hooks are called in
  // consistent order regardless of columnType (React rules of hooks).
  // Finding #10 (R8): status dropdown click-outside + ESC handler
  useEffect(() => {
    if (!isEditing || columnType !== 'STATUS') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsEditing(false);
    };
    // Delay to avoid the opening click from immediately closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isEditing, columnType]);

  // Checkbox type - always editable, no edit mode
  if (columnType === 'CHECKBOX') {
    return (
      <TableCell
        onClick={onFocus}
        className={`h-12 px-4 ${isFocused ? 'ring-2 ring-primary' : ''}`}
        aria-label={`${columnId}, ${value ? 'checked' : 'unchecked'}, checkbox`}
        role="gridcell"
      >
        <Checkbox
          checked={value === true || value === 'true'}
          onCheckedChange={(checked) => onUpdate(checked)}
        />
      </TableCell>
    );
  }

  // Date picker type
  if (columnType === 'DATE') {
    return (
      <TableCell
        onClick={onFocus}
        className={`h-12 px-4 ${isFocused ? 'ring-2 ring-primary' : ''}`}
        aria-label={`${columnId}, ${value || 'no date set'}, date picker`}
        role="gridcell"
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => {
                if (date) {
                  onUpdate(date.toISOString());
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </TableCell>
    );
  }


  // Status badge type
  if (columnType === 'STATUS') {
    // Finding #6 (R9): use custom options from column metadata if provided
    const statusOptions = customStatusOptions ?? [...DEFAULT_STATUS_OPTIONS];
    const statusColors = DEFAULT_STATUS_COLORS;

    if (isEditing) {
      return (
        <TableCell className="h-12 px-4 py-0 relative" ref={statusDropdownRef}>
          <div className="absolute left-0 top-full mt-1 bg-background border rounded-md shadow-lg z-50 min-w-[200px]">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onUpdate(status);
                  setIsEditing(false);
                }}
              >
                {value === status && <Check className="mr-2 h-4 w-4" />}
                <Badge className={statusColors[status]}>{status}</Badge>
              </Button>
            ))}
          </div>
          <Badge className={statusColors[value as string] || 'bg-gray-500'}>
            {value || 'Select'}
          </Badge>
        </TableCell>
      );
    }

    return (
      <TableCell
        onClick={() => {
          onFocus();
          setIsEditing(true);
        }}
        className={`h-12 px-4 cursor-pointer ${isFocused ? 'ring-2 ring-primary' : ''}`}
        aria-label={`${columnId}, ${value || 'no status'}, status dropdown`}
        role="gridcell"
      >
        <Badge className={statusColors[value as string] || 'bg-gray-500'}>
          {value || 'Select'}
        </Badge>
      </TableCell>
    );
  }

  // Contact/User type
  if (columnType === 'CONTACT') {
    return (
      <TableCell
        onClick={() => {
          onFocus();
          if (!isEditing) setIsEditing(true);
        }}
        className={`h-12 px-4 cursor-pointer relative group ${isFocused ? 'ring-2 ring-primary' : ''} ${isEditing ? 'bg-accent/10' : ''}`}
        aria-label={`${columnId}, ${value || 'unassigned'}, editable contact`}
        role="gridcell"
        style={{
          fontWeight: style.fontWeight === 'bold' ? 'bold' : 'normal',
          fontStyle: style.fontStyle === 'italic' ? 'italic' : 'normal',
          textDecoration: style.textDecoration === 'line-through' ? 'line-through' : 'none'
        }}
      >
        {!isEditing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          </div>
        )}
        {justSaved && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <Check className="h-3 w-3 text-green-500" />
          </div>
        )}

        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue ?? ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setEditValue(newValue);
              setIsSaving(true);
              debouncedUpdate(newValue);
            }}
            onBlur={() => {
              debouncedUpdate.flush();
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                debouncedUpdate.flush();
                setIsEditing(false);
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
              e.stopPropagation();
            }}
            className="h-8 w-full"
            placeholder="Enter name or email"
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
              {value ? String(value).charAt(0).toUpperCase() : '?'}
            </div>
            <span>{value || 'Unassigned'}</span>
          </div>
        )}
      </TableCell>
    );
  }

  // Number type
  if (columnType === 'NUMBER') {
    return (
      <TableCell
        onClick={() => {
          onFocus();
          if (!isEditing) setIsEditing(true);
        }}
        className={`h-12 px-4 cursor-pointer relative group ${isFocused ? 'ring-2 ring-primary' : ''} ${isEditing ? 'bg-accent/10' : ''}`}
        aria-label={`${columnId}, ${value ?? 'empty'}, editable number`}
        role="gridcell"
        style={{
          fontWeight: style.fontWeight === 'bold' ? 'bold' : 'normal',
          fontStyle: style.fontStyle === 'italic' ? 'italic' : 'normal',
          textDecoration: style.textDecoration === 'line-through' ? 'line-through' : 'none',
          textAlign: 'right'
        }}
      >
        {!isEditing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          </div>
        )}
        {justSaved && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <Check className="h-3 w-3 text-green-500" />
          </div>
        )}

        {isEditing ? (
          <Input
            ref={inputRef}
            type="number"
            value={editValue ?? ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setEditValue(newValue);
              setIsSaving(true);
              debouncedUpdate(newValue);
            }}
            onBlur={() => {
              debouncedUpdate.flush();
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                debouncedUpdate.flush();
                setIsEditing(false);
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
              e.stopPropagation();
            }}
            className="h-8 w-full text-right"
          />
        ) : (
          <span>{value ?? ''}</span>
        )}
      </TableCell>
    );
  }

  // Default: Text type
  return (
    <TableCell
      onClick={() => {
        onFocus();
        if (!isEditing) setIsEditing(true);
      }}
      className={`h-12 px-4 cursor-pointer relative group ${isFocused ? 'ring-2 ring-primary' : ''} ${isEditing ? 'bg-accent/10' : ''}`}
      aria-label={`${columnId}, ${value ?? 'empty'}, editable text`}
      role="gridcell"
      style={{
        fontWeight: style.fontWeight === 'bold' ? 'bold' : 'normal',
        fontStyle: style.fontStyle === 'italic' ? 'italic' : 'normal',
        textDecoration: style.textDecoration === 'line-through' ? 'line-through' : 'none'
      }}
    >
      {/* Hover indicator */}
      {!isEditing && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </div>
      )}

      {/* Saving/saved indicator */}
      {isSaving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        </div>
      )}
      {justSaved && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <Check className="h-3 w-3 text-green-500" />
        </div>
      )}

      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue ?? ''}
          onChange={(e) => {
            const newValue = e.target.value;
            setEditValue(newValue);
            setIsSaving(true);
            debouncedUpdate(newValue);
          }}
          onBlur={() => {
            debouncedUpdate.flush(); // Ensure update happens on blur
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              debouncedUpdate.flush();
              setIsEditing(false);
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              handleCancel();
            }
            e.stopPropagation();
          }}
          className="h-8 w-full"
        />
      ) : (
        <span>{value ?? ''}</span>
      )}
    </TableCell>
  );
}
