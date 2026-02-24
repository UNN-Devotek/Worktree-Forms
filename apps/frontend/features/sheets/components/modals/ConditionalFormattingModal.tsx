'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';
import type {
  ConditionalFormatRule,
  FilterOperator,
  CellStyleConfig,
} from '../../types/cell-styles';

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_FAMILIES = ['Auto', 'Inter', 'Arial', 'Roboto', 'Georgia', 'Courier New', 'Times New Roman'];
const FONT_SIZES = ['Auto', 10, 11, 12, 14, 16, 18, 24, 36] as const;

const TEXT_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'is_blank', label: 'is blank' },
  { value: 'is_not_blank', label: 'is not blank' },
];

const NUMBER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '\u2260' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'greater_or_equal', label: '\u2265' },
  { value: 'less_or_equal', label: '\u2264' },
  { value: 'is_blank', label: 'is blank' },
  { value: 'is_not_blank', label: 'is not blank' },
];

const DATE_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'less_than', label: 'before' },
  { value: 'greater_than', label: 'after' },
  { value: 'equals', label: 'equals' },
  { value: 'is_blank', label: 'is blank' },
  { value: 'is_not_blank', label: 'is not blank' },
];

const VALUE_FREE_OPERATORS: FilterOperator[] = ['is_blank', 'is_not_blank'];

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildBlankRule(priority: number): ConditionalFormatRule {
  return {
    id: crypto.randomUUID(),
    name: '',
    columnId: '',
    operator: 'equals',
    value: null,
    style: {},
    applyToRow: true,
    priority,
    enabled: true,
  };
}

function getColumnType(columns: Array<{ id: string; label: string; type: string }>, columnId: string): string {
  return columns.find((c) => c.id === columnId)?.type ?? 'TEXT';
}

function describeCondition(
  rule: ConditionalFormatRule,
  columns: Array<{ id: string; label: string; type: string }>,
): string {
  if (!rule.columnId) return 'condition';
  const col = columns.find((c) => c.id === rule.columnId);
  const colLabel = col?.label ?? rule.columnId;
  const allOps = [...TEXT_OPERATORS, ...NUMBER_OPERATORS, ...DATE_OPERATORS];
  const opLabel = allOps.find((o) => o.value === rule.operator)?.label ?? rule.operator;
  if (VALUE_FREE_OPERATORS.includes(rule.operator)) {
    return `${colLabel} ${opLabel}`;
  }
  return `${colLabel} ${opLabel} "${rule.value ?? ''}"`;
}

function describeFormat(style: Partial<CellStyleConfig>): string {
  const parts: string[] = [];
  if (style.backgroundColor) parts.push('bg');
  if (style.color) parts.push('color');
  if (style.fontWeight === 'bold') parts.push('bold');
  if (style.fontStyle === 'italic') parts.push('italic');
  if (style.textDecoration === 'underline') parts.push('underline');
  if (style.textDecoration === 'line-through') parts.push('strike');
  return parts.length > 0 ? parts.join(', ') : 'this format';
}

// ─── SetConditionDialog ───────────────────────────────────────────────────────

interface SetConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: ConditionalFormatRule;
  columns: Array<{ id: string; label: string; type: string }>;
  onSave: (updates: Pick<ConditionalFormatRule, 'columnId' | 'operator' | 'value'>) => void;
}

function SetConditionDialog({ open, onOpenChange, rule, columns, onSave }: SetConditionDialogProps) {
  const [selectedColumnId, setSelectedColumnId] = useState(rule.columnId);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>(rule.operator);
  const [value, setValue] = useState<string>(rule.value != null ? String(rule.value) : '');

  useEffect(() => {
    if (open) {
      setSelectedColumnId(rule.columnId);
      setSelectedOperator(rule.operator);
      setValue(rule.value != null ? String(rule.value) : '');
    }
  }, [open, rule]);

  const colType = getColumnType(columns, selectedColumnId);

  function handleColumnSelect(columnId: string) {
    const newType = getColumnType(columns, columnId);
    setSelectedColumnId(columnId);
    // Reset operator to first valid for the new type
    if (newType === 'NUMBER') {
      setSelectedOperator(NUMBER_OPERATORS[0].value);
    } else if (newType === 'DATE') {
      setSelectedOperator(DATE_OPERATORS[0].value);
    } else if (newType === 'CHECKBOX') {
      setSelectedOperator('equals');
      setValue('true');
    } else {
      setSelectedOperator(TEXT_OPERATORS[0].value);
    }
    setValue('');
  }

  function handleOk() {
    const finalValue: string | number | boolean | null =
      colType === 'CHECKBOX'
        ? value === 'true'
        : colType === 'NUMBER' && value !== '' && !VALUE_FREE_OPERATORS.includes(selectedOperator)
        ? Number(value)
        : VALUE_FREE_OPERATORS.includes(selectedOperator)
        ? null
        : value || null;

    onSave({
      columnId: selectedColumnId,
      operator: selectedOperator,
      value: finalValue,
    });
    onOpenChange(false);
  }

  const operatorList =
    colType === 'NUMBER'
      ? NUMBER_OPERATORS
      : colType === 'DATE'
      ? DATE_OPERATORS
      : TEXT_OPERATORS;

  const showValueInput =
    colType !== 'CHECKBOX' && !VALUE_FREE_OPERATORS.includes(selectedOperator);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle>Set Condition</DialogTitle>
        </DialogHeader>

        <div className="flex h-[340px]">
          {/* Left: column list */}
          <div className="w-[180px] border-r flex flex-col">
            <p className="text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wide">
              1. Select column
            </p>
            <ScrollArea className="flex-1">
              <div className="px-2 pb-2">
                {columns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleColumnSelect(col.id)}
                    className={cn(
                      'w-full text-left text-sm px-3 py-2 rounded-md transition-colors',
                      selectedColumnId === col.id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-muted text-foreground',
                    )}
                  >
                    {col.label || col.id}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: criteria */}
          <div className="flex-1 flex flex-col">
            <p className="text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wide">
              2. Select criteria
            </p>

            {!selectedColumnId ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-6 text-center">
                Please choose a column to define criteria.
              </div>
            ) : (
              <div className="px-4 pb-4 space-y-4">
                {colType === 'CHECKBOX' ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Checkbox state
                    </Label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="checkbox-op"
                          value="true"
                          checked={value === 'true'}
                          onChange={() => {
                            setSelectedOperator('equals');
                            setValue('true');
                          }}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">is Checked</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="checkbox-op"
                          value="false"
                          checked={value === 'false'}
                          onChange={() => {
                            setSelectedOperator('equals');
                            setValue('false');
                          }}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">is Not Checked</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Operator
                      </Label>
                      <Select
                        value={selectedOperator}
                        onValueChange={(v: FilterOperator) => setSelectedOperator(v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorList.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {showValueInput && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                          Value
                        </Label>
                        <Input
                          type={colType === 'NUMBER' ? 'number' : colType === 'DATE' ? 'date' : 'text'}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder="Enter value..."
                          className="h-9"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleOk} disabled={!selectedColumnId}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SelectScopeDialog ────────────────────────────────────────────────────────

interface SelectScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: ConditionalFormatRule;
  columns: Array<{ id: string; label: string; type: string }>;
  onSave: (updates: Pick<ConditionalFormatRule, 'applyToRow' | 'columnId'>) => void;
}

function SelectScopeDialog({ open, onOpenChange, rule, columns, onSave }: SelectScopeDialogProps) {
  // scope: 'row' = apply to row, otherwise it's a columnId
  const [scope, setScope] = useState<string>(rule.applyToRow ? 'row' : rule.columnId);

  useEffect(() => {
    if (open) {
      setScope(rule.applyToRow ? 'row' : rule.columnId);
    }
  }, [open, rule]);

  function handleOk() {
    if (scope === 'row') {
      onSave({ applyToRow: true, columnId: rule.columnId });
    } else {
      onSave({ applyToRow: false, columnId: rule.columnId });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle>Select what to format:</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <button
            type="button"
            onClick={() => setScope('row')}
            className={cn(
              'w-full flex items-center justify-between text-sm px-6 py-2.5 hover:bg-muted transition-colors',
            )}
          >
            <span>entire row</span>
            {scope === 'row' && <Check className="h-4 w-4 text-blue-600" />}
          </button>
          <Separator />
          {columns.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setScope(col.id)}
              className={cn(
                'w-full flex items-center justify-between text-sm px-6 py-2.5 hover:bg-muted transition-colors',
              )}
            >
              <span>{col.label || col.id}</span>
              {scope === col.id && <Check className="h-4 w-4 text-blue-600" />}
            </button>
          ))}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleOk}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── FormatPopover ────────────────────────────────────────────────────────────

interface FormatPopoverProps {
  style: Partial<CellStyleConfig>;
  onStyleChange: (style: Partial<CellStyleConfig>) => void;
  children: React.JSX.Element;
}

function FormatPopover({ style, onStyleChange, children }: FormatPopoverProps) {
  const [open, setOpen] = useState(false);

  function update(patch: Partial<CellStyleConfig>) {
    onStyleChange({ ...style, ...patch });
  }

  const isBold = style.fontWeight === 'bold';
  const isItalic = style.fontStyle === 'italic';
  const isUnderline = style.textDecoration === 'underline';
  const isStrike = style.textDecoration === 'line-through';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-3 space-y-3"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        {/* Font family */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Font</Label>
          <Select
            value={style.fontFamily ?? 'Auto'}
            onValueChange={(v) => update({ fontFamily: v === 'Auto' ? undefined : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f} value={f} className="text-xs">
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font size */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Size</Label>
          <Select
            value={style.fontSize != null ? String(style.fontSize) : 'Auto'}
            onValueChange={(v) => update({ fontSize: v === 'Auto' ? undefined : Number(v) })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((s) => (
                <SelectItem key={String(s)} value={String(s)} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bold / Italic / Underline / Strikethrough */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Style</Label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => update({ fontWeight: isBold ? 'normal' : 'bold' })}
              className={cn(
                'h-8 rounded border text-sm font-bold transition-colors',
                isBold
                  ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300'
                  : 'border-input hover:bg-muted',
              )}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => update({ fontStyle: isItalic ? 'normal' : 'italic' })}
              className={cn(
                'h-8 rounded border text-sm italic transition-colors',
                isItalic
                  ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300'
                  : 'border-input hover:bg-muted',
              )}
            >
              I
            </button>
            <button
              type="button"
              onClick={() =>
                update({ textDecoration: isUnderline ? 'none' : 'underline' })
              }
              className={cn(
                'h-8 rounded border text-sm underline transition-colors',
                isUnderline
                  ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300'
                  : 'border-input hover:bg-muted',
              )}
            >
              U
            </button>
            <button
              type="button"
              onClick={() =>
                update({ textDecoration: isStrike ? 'none' : 'line-through' })
              }
              className={cn(
                'h-8 rounded border text-sm line-through transition-colors',
                isStrike
                  ? 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-300'
                  : 'border-input hover:bg-muted',
              )}
            >
              S
            </button>
          </div>
        </div>

        <Separator />

        {/* Background color */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Background color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.backgroundColor ?? '#ffffff'}
              onChange={(e) => update({ backgroundColor: e.target.value })}
              className="h-7 w-10 rounded border border-input cursor-pointer p-0.5"
            />
            <span className="text-xs text-muted-foreground flex-1 truncate">
              {style.backgroundColor ?? 'none'}
            </span>
            {style.backgroundColor && (
              <button
                type="button"
                onClick={() => {
                  const { backgroundColor: _bg, ...rest } = style;
                  onStyleChange(rest);
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Text color */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Text color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.color ?? '#000000'}
              onChange={(e) => update({ color: e.target.value })}
              className="h-7 w-10 rounded border border-input cursor-pointer p-0.5"
            />
            <span className="text-xs text-muted-foreground flex-1 truncate">
              {style.color ?? 'none'}
            </span>
            {style.color && (
              <button
                type="button"
                onClick={() => {
                  const { color: _c, ...rest } = style;
                  onStyleChange(rest);
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── RuleRow ──────────────────────────────────────────────────────────────────

interface RuleRowProps {
  rule: ConditionalFormatRule;
  columns: Array<{ id: string; label: string; type: string }>;
  onUpdate: (id: string, patch: Partial<ConditionalFormatRule>) => void;
  onDelete: (id: string) => void;
}

function RuleRow({ rule, columns, onUpdate, onDelete }: RuleRowProps) {
  const [conditionOpen, setConditionOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);

  const scopeLabel = rule.applyToRow
    ? 'entire row'
    : (columns.find((c) => c.id === rule.columnId)?.label ?? rule.columnId) || 'entire row';

  return (
    <>
      <div className="flex items-center gap-3 py-3 px-4 border-b last:border-b-0">
        {/* Enabled toggle */}
        <Checkbox
          checked={rule.enabled}
          onCheckedChange={(checked) => onUpdate(rule.id, { enabled: !!checked })}
          className="shrink-0"
        />

        {/* Rule description */}
        <div className="flex-1 min-w-0 text-sm flex flex-wrap items-center gap-1">
          <span className="text-muted-foreground">If</span>
          <button
            type="button"
            onClick={() => setConditionOpen(true)}
            className="text-blue-600 underline underline-offset-2 hover:text-blue-700 transition-colors truncate max-w-[220px]"
          >
            {describeCondition(rule, columns)}
          </button>
          <span className="text-muted-foreground">then apply</span>
          <FormatPopover
            style={rule.style}
            onStyleChange={(style) => onUpdate(rule.id, { style })}
          >
            <button
              type="button"
              className="text-blue-600 underline underline-offset-2 hover:text-blue-700 transition-colors"
            >
              {describeFormat(rule.style)}
            </button>
          </FormatPopover>
          <span className="text-muted-foreground">to the</span>
          <button
            type="button"
            onClick={() => setScopeOpen(true)}
            className="text-blue-600 underline underline-offset-2 hover:text-blue-700 transition-colors"
          >
            {scopeLabel}
          </button>
        </div>

        {/* Preview */}
        <div className="shrink-0 flex items-center gap-1.5">
          <div
            className="h-7 px-2 rounded border flex items-center text-xs font-medium min-w-[52px] justify-center"
            style={{
              backgroundColor: rule.style.backgroundColor ?? undefined,
              color: rule.style.color ?? undefined,
              fontWeight: rule.style.fontWeight ?? undefined,
              fontStyle: rule.style.fontStyle ?? undefined,
              textDecoration: rule.style.textDecoration ?? undefined,
              fontFamily: rule.style.fontFamily ?? undefined,
              fontSize: rule.style.fontSize ? `${rule.style.fontSize}px` : undefined,
            }}
          >
            abcde
          </div>
          {rule.style.backgroundColor && (
            <div
              className="h-5 w-5 rounded border shrink-0"
              style={{ backgroundColor: rule.style.backgroundColor }}
              title={rule.style.backgroundColor}
            />
          )}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(rule.id)}
          className="shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Delete rule"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <SetConditionDialog
        open={conditionOpen}
        onOpenChange={setConditionOpen}
        rule={rule}
        columns={columns}
        onSave={(updates) => onUpdate(rule.id, updates)}
      />

      <SelectScopeDialog
        open={scopeOpen}
        onOpenChange={setScopeOpen}
        rule={rule}
        columns={columns}
        onSave={(updates) => onUpdate(rule.id, updates)}
      />
    </>
  );
}

// ─── ConditionalFormattingModal ───────────────────────────────────────────────

export function ConditionalFormattingModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { columns, conditionalFormats, setConditionalFormats } = useSheet();
  const [draftRules, setDraftRules] = useState<ConditionalFormatRule[]>([]);

  // Sync draft from Yjs when the modal opens
  useEffect(() => {
    if (open) {
      setDraftRules([...conditionalFormats]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAddRule() {
    const newRule = buildBlankRule(draftRules.length);
    setDraftRules((prev) => [...prev, newRule]);
  }

  function handleUpdateRule(id: string, patch: Partial<ConditionalFormatRule>) {
    setDraftRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  function handleDeleteRule(id: string) {
    setDraftRules((prev) => prev.filter((r) => r.id !== id));
  }

  function handleOk() {
    // Re-assign priorities based on current array order (index 0 = highest priority)
    const withPriorities = draftRules.map((r, i) => ({ ...r, priority: i }));
    setConditionalFormats(withPriorities);
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">Conditional Formatting</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={handleAddRule}
          >
            <Plus className="h-3.5 w-3.5" />
            Add New Rule
          </Button>
        </div>

        {/* Rules list */}
        <ScrollArea className="flex-1 min-h-0">
          {draftRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-2">
              <p>No conditional formatting rules.</p>
              <p className="text-xs">Click &quot;Add New Rule&quot; to get started.</p>
            </div>
          ) : (
            <div className="divide-y">
              {draftRules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  columns={columns}
                  onUpdate={handleUpdateRule}
                  onDelete={handleDeleteRule}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center gap-3 shrink-0">
          <p className="text-xs text-muted-foreground flex-1">
            Note: higher rules take priority over lower rules.
          </p>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleOk}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
