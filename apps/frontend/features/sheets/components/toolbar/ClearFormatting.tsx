'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';
import { DEFAULT_CELL_STYLE } from '../../types/cell-styles';
import { t } from '@/lib/i18n';

interface ClearFormattingProps {
  className?: string;
}

export function ClearFormatting({ className }: ClearFormattingProps) {
  const {
    focusedCell,
    applyCellStyle,
  } = useSheet();

  const isDisabled = !focusedCell;

  const handleClearFormatting = () => {
    // Spread all fields of DEFAULT_CELL_STYLE so every property is explicitly
    // reset, not just patched — this prevents stale overrides from persisting.
    const resetStyle = { ...DEFAULT_CELL_STYLE };

    if (focusedCell) {
      applyCellStyle(focusedCell.rowId, focusedCell.columnId, resetStyle);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', className)}
          onClick={handleClearFormatting}
          disabled={isDisabled}
          aria-label={t('toolbar.clear_formatting', 'Clear formatting')}
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{t('toolbar.clear_formatting', 'Clear formatting')}</p>
      </TooltipContent>
    </Tooltip>
  );
}
