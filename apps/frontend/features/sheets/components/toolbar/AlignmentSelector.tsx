'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';

interface AlignmentSelectorProps {
  className?: string;
}

const hAlignOptions = [
  { value: 'left',   icon: AlignLeft,   label: 'Align Left' },
  { value: 'center', icon: AlignCenter, label: 'Align Center' },
  { value: 'right',  icon: AlignRight,  label: 'Align Right' },
] as const;

const vAlignOptions = [
  { value: 'top',    icon: AlignVerticalJustifyStart,  label: 'Align Top' },
  { value: 'middle', icon: AlignVerticalJustifyCenter, label: 'Align Middle' },
  { value: 'bottom', icon: AlignVerticalJustifyEnd,    label: 'Align Bottom' },
] as const;

export function AlignmentSelector({ className }: AlignmentSelectorProps) {
  const {
    focusedCell,
    getCellStyle,
    applyCellStyle,
    selectedColumnIds,
    selectedFormattingRowIds,
    applyColumnStyle,
    applyRowStyle,
    data,
    columns,
  } = useSheet();

  const currentStyle = (() => {
    if (focusedCell) return getCellStyle(focusedCell.rowId, focusedCell.columnId);
    if (selectedColumnIds.size > 0 && data[0]) return getCellStyle(data[0].id, [...selectedColumnIds][0]);
    if (selectedFormattingRowIds.size > 0 && (columns as any[])[0])
      return getCellStyle([...selectedFormattingRowIds][0], (columns as any[])[0].id);
    return null;
  })();

  const currentHAlign = currentStyle?.textAlign || 'left';
  const currentVAlign = currentStyle?.verticalAlign || 'middle';
  const CurrentHIcon = hAlignOptions.find(o => o.value === currentHAlign)?.icon ?? AlignLeft;

  const applyStyle = (style: { textAlign?: 'left' | 'center' | 'right'; verticalAlign?: 'top' | 'middle' | 'bottom' }) => {
    if (focusedCell) {
      applyCellStyle(focusedCell.rowId, focusedCell.columnId, style);
    } else if (selectedColumnIds.size > 0) {
      selectedColumnIds.forEach(colId => applyColumnStyle(colId, style));
    } else if (selectedFormattingRowIds.size > 0) {
      selectedFormattingRowIds.forEach(rowId => applyRowStyle(rowId, style));
    }
  };

  const isDisabled = !focusedCell && selectedColumnIds.size === 0 && selectedFormattingRowIds.size === 0;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', className)}
              disabled={isDisabled}
            >
              <CurrentHIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Alignment</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-auto p-1.5 space-y-1" align="start">
        {/* Horizontal alignment */}
        <div className="flex gap-0.5">
          {hAlignOptions.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', currentHAlign === value && 'bg-accent')}
              onClick={() => applyStyle({ textAlign: value })}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        {/* Vertical alignment */}
        <div className="flex gap-0.5">
          {vAlignOptions.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', currentVAlign === value && 'bg-accent')}
              onClick={() => applyStyle({ verticalAlign: value })}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
