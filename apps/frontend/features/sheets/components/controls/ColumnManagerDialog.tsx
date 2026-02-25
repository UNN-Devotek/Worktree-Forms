'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Type,
  List,
  Calendar,
  Clock,
  User,
  Check,
  Hash,
  UserPlus,
  CalendarPlus,
  MessageSquare,
  UserCog,
  CalendarCheck,
  Percent,
  AlignLeft,
  Link2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useSheet } from '../../providers/SheetProvider';
import { t } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Column type definitions
// ---------------------------------------------------------------------------

const COLUMN_TYPES = [
  { value: 'TEXT',          label: 'Text / Number',  icon: Type          },
  { value: 'DROPDOWN',      label: 'Dropdown list',  icon: List          },
  { value: 'DATE',          label: 'Date',           icon: Calendar      },
  { value: 'DURATION',      label: 'Duration',       icon: Clock         },
  { value: 'CONTACT',       label: 'Contact list',   icon: User          },
  { value: 'CHECKBOX',      label: 'Checkbox',       icon: Check         },
  { value: 'PERCENT',       label: 'Percent',        icon: Percent       },
  { value: 'NUMBER',        label: 'Auto number',    icon: Hash          },
  { value: 'LONGTEXT',      label: 'Long text',      icon: AlignLeft     },
  { value: 'URL',           label: 'URL / Link',     icon: Link2         },
  { value: 'CREATED_BY',    label: 'Created by',     icon: UserPlus      },
  { value: 'CREATED_DATE',  label: 'Created date',   icon: CalendarPlus  },
  { value: 'COMMENT',       label: 'Latest Comment', icon: MessageSquare },
  { value: 'MODIFIED_BY',   label: 'Modified by',    icon: UserCog       },
  { value: 'MODIFIED_DATE', label: 'Modified date',  icon: CalendarCheck },
] as const;

type ColumnTypeValue = typeof COLUMN_TYPES[number]['value'];

// ---------------------------------------------------------------------------
// Shared column data shape
// ---------------------------------------------------------------------------

export interface EditableColumn {
  id: string;
  label: string;
  type: string;
  options?: string[];
  allowMultiple?: boolean;
  restrictToList?: boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// AddColumnDialog — controlled, no trigger button
// Doubles as EditColumnDialog when `editColumn` is provided.
// ---------------------------------------------------------------------------

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog operates in edit mode */
  editColumn?: EditableColumn;
}

export function AddColumnDialog({ open, onOpenChange, editColumn }: AddColumnDialogProps) {
  const { addColumn, updateColumn } = useSheet();
  const isEditMode = Boolean(editColumn);

  const [name, setName]                       = useState('');
  const [type, setType]                       = useState<ColumnTypeValue>('TEXT');
  const [allowMultiple, setAllowMultiple]     = useState(false);
  const [restrictToList, setRestrictToList]   = useState(false);
  const [valuesText, setValuesText]           = useState('');

  // Populate form when entering edit mode
  useEffect(() => {
    if (open && editColumn) {
      setName(editColumn.label ?? '');
      const colType = COLUMN_TYPES.find(ct => ct.value === editColumn.type)
        ? editColumn.type as ColumnTypeValue
        : 'TEXT';
      setType(colType);
      setAllowMultiple(editColumn.allowMultiple ?? false);
      setRestrictToList(editColumn.restrictToList ?? false);
      setValuesText((editColumn.options ?? []).join('\n'));
    } else if (open && !editColumn) {
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editColumn]);

  // When switching away from DROPDOWN, reset dropdown-specific state
  const handleTypeSelect = (v: ColumnTypeValue) => {
    if (v !== 'DROPDOWN') {
      setAllowMultiple(false);
      setRestrictToList(false);
      // Keep valuesText so it isn't lost if user switches back in edit mode
    }
    setType(v);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const options = type === 'DROPDOWN'
      ? valuesText.split('\n').map(s => s.trim()).filter(Boolean)
      : undefined;

    if (isEditMode && editColumn) {
      // Edit mode — update existing column, preserve all other fields
      const updates: Record<string, unknown> = {
        label: name.trim(),
        type,
        ...(type === 'DROPDOWN'
          ? { options, allowMultiple, restrictToList }
          : { options: undefined, allowMultiple: undefined, restrictToList: undefined }),
      };
      updateColumn(editColumn.id, updates);
    } else {
      // Add mode — create new column
      addColumn({
        id: `col_${crypto.randomUUID().slice(0, 8)}`,
        label: name.trim(),
        type,
        width: 150,
        ...(type === 'DROPDOWN' && { options, allowMultiple, restrictToList }),
      });
    }
    reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const reset = () => {
    setName('');
    setType('TEXT');
    setAllowMultiple(false);
    setRestrictToList(false);
    setValuesText('');
  };

  const isDropdown = type === 'DROPDOWN';
  const selectedTypeDef = COLUMN_TYPES.find(ct => ct.value === type)!;
  const SelectedIcon = selectedTypeDef.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
      <DialogContent className="sm:max-w-[360px] p-0 gap-0 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {isEditMode
              ? t('column.dialog_title_edit', 'Edit Column')
              : t('column.dialog_title', 'New Column')}
          </DialogTitle>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 space-y-4">

          {/* Name field */}
          <div className="space-y-1.5">
            <Label htmlFor="col-name" className="text-sm font-medium">
              {t('column.name_label', 'Name')}
            </Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('column.name_placeholder', 'Enter a column name')}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isDropdown) handleSave(); }}
              autoFocus
              className="h-10"
            />
          </div>

          {/* Column Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {t('column.type_label', 'Column Type')}
            </Label>

            {/* ── DROPDOWN selected: compact selector + options ─────────────── */}
            {isDropdown ? (
              <div className="space-y-4">
                {/* Compact type selector — click to go back to list */}
                <button
                  type="button"
                  onClick={() => setType('TEXT')}
                  className="w-full flex items-center gap-3 px-3 h-10 border rounded-md text-sm text-left hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <SelectedIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{selectedTypeDef.label}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>

                {/* Toggle: Allow multiple values per cell */}
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="allow-multiple" className="text-sm font-normal cursor-pointer select-none">
                    Allow multiple values per cell
                  </Label>
                  <Switch
                    id="allow-multiple"
                    checked={allowMultiple}
                    onCheckedChange={setAllowMultiple}
                  />
                </div>

                {/* Toggle: Restrict to list values only */}
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="restrict-list" className="text-sm font-normal cursor-pointer select-none">
                    Restrict to list values only
                  </Label>
                  <Switch
                    id="restrict-list"
                    checked={restrictToList}
                    onCheckedChange={setRestrictToList}
                  />
                </div>

                {/* Values textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm font-medium">Values</Label>
                    <span title="Enter one option per line">
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </span>
                  </div>
                  <Textarea
                    value={valuesText}
                    onChange={(e) => setValuesText(e.target.value)}
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    className="resize-y min-h-[120px] text-sm font-mono"
                  />
                  {valuesText.trim() && (
                    <p className="text-[11px] text-muted-foreground">
                      {valuesText.split('\n').filter(s => s.trim()).length} option(s) · one per line
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* ── All other types: scrollable list ──────────────────────────── */
              <div className="border rounded-md overflow-hidden">
                <ScrollArea className="h-[320px]">
                  {COLUMN_TYPES.map((ct, idx) => {
                    const Icon = ct.icon;
                    const isSelected = type === ct.value;
                    return (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => handleTypeSelect(ct.value)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer',
                          idx !== 0 && 'border-t border-border/50',
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/60 text-foreground'
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        <span>{ct.label}</span>
                      </button>
                    );
                  })}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="neutral" onClick={handleCancel} className="px-6">
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="px-8">
            {t('common.ok', 'Ok')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Keep ColumnManagerDialog as a re-export alias for any existing references
export { AddColumnDialog as ColumnManagerDialog };
