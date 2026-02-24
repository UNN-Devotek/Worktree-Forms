'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paintbrush } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';
import { CellStyleConfig } from '../../types/cell-styles';
import { t } from '@/lib/i18n';

interface FormatPainterProps {
  className?: string;
}

export function FormatPainter({ className }: FormatPainterProps) {
  const { focusedCell, getCellStyle, applyCellStyle } = useSheet();

  // The style captured when the user clicks the painter button
  const [copiedStyle, setCopiedStyle] = useState<CellStyleConfig | null>(null);
  const isPainting = copiedStyle !== null;

  // Track the previous focused cell so we can detect genuine cell-to-cell navigation
  // and avoid firing on the initial render or on the cell that was focused when the
  // user activated painting mode.
  const prevFocusedCellRef = useRef<{ rowId: string; columnId: string } | null>(null);
  // The cell that was focused at the moment the user clicked "paint" — we must
  // skip applying to that same cell on the first focusedCell change event.
  const paintOriginRef = useRef<{ rowId: string; columnId: string } | null>(null);

  useEffect(() => {
    if (!isPainting) {
      // When not painting just keep prevFocusedCellRef in sync so the next
      // activation starts from the correct baseline.
      prevFocusedCellRef.current = focusedCell;
      return;
    }

    // No cell focused — nothing to apply yet
    if (!focusedCell) return;

    const prev = prevFocusedCellRef.current;
    const origin = paintOriginRef.current;

    // Determine whether the focused cell has actually changed
    const cellChanged =
      prev === null ||
      prev.rowId !== focusedCell.rowId ||
      prev.columnId !== focusedCell.columnId;

    if (!cellChanged) return;

    // Skip the origin cell itself (same cell the user was on when they clicked paint)
    const isOrigin =
      origin !== null &&
      origin.rowId === focusedCell.rowId &&
      origin.columnId === focusedCell.columnId;

    prevFocusedCellRef.current = focusedCell;

    if (isOrigin) return;

    // Apply the copied style to the newly focused cell and exit painting mode
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, { ...copiedStyle! });
    setCopiedStyle(null);
    paintOriginRef.current = null;
  }, [focusedCell, isPainting, copiedStyle, applyCellStyle]);

  const handleClick = () => {
    if (isPainting) {
      // Second click while in painting mode cancels it
      setCopiedStyle(null);
      paintOriginRef.current = null;
      return;
    }

    if (!focusedCell) return;

    const style = getCellStyle(focusedCell.rowId, focusedCell.columnId);
    setCopiedStyle({ ...style });
    paintOriginRef.current = { ...focusedCell };
    // Ensure prevFocusedCellRef is aligned so the effect correctly detects the
    // first navigation away from this cell.
    prevFocusedCellRef.current = { ...focusedCell };
  };

  const isDisabled = !focusedCell && !isPainting;

  const tooltipText = isPainting
    ? t('toolbar.format_painter_active', 'Click a cell to apply formatting')
    : t('toolbar.format_painter', 'Format painter');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8',
            isPainting && 'bg-accent text-accent-foreground',
            className
          )}
          onClick={handleClick}
          disabled={isDisabled}
          aria-label={tooltipText}
          aria-pressed={isPainting}
        >
          <Paintbrush className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
