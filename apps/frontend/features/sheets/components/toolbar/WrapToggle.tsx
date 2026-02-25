'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { WrapText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';

interface WrapToggleProps {
  className?: string;
}

export function WrapToggle({ className }: WrapToggleProps) {
  const {
    focusedCell, getCellStyle, applyCellStyle,
    selectedColumnIds, selectedFormattingRowIds,
    applyColumnStyle, applyRowStyle,
    data, columns,
  } = useSheet();

  const currentStyle = (() => {
    if (focusedCell) return getCellStyle(focusedCell.rowId, focusedCell.columnId);
    if (selectedColumnIds.size > 0 && data[0]) return getCellStyle(data[0].id, [...selectedColumnIds][0]);
    if (selectedFormattingRowIds.size > 0 && columns[0]) return getCellStyle([...selectedFormattingRowIds][0], columns[0].id);
    return null;
  })();

  const isWrapped = currentStyle?.wrap === true;

  const handleToggleWrap = () => {
    const style = { wrap: !isWrapped };
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            isWrapped && "bg-accent text-accent-foreground",
            className
          )}
          onClick={handleToggleWrap}
          disabled={isDisabled}
        >
          <WrapText className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Wrap Text</p>
      </TooltipContent>
    </Tooltip>
  );
}
