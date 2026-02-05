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
  const { focusedCell, getCellStyle, applyCellStyle } = useSheet();
  
  const currentStyle = focusedCell 
    ? getCellStyle(focusedCell.rowId, focusedCell.columnId) 
    : null;
  
  const isWrapped = currentStyle?.wrap === true;
  
  const handleToggleWrap = () => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      wrap: !isWrapped,
    });
  };
  
  const isDisabled = !focusedCell;
  
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
