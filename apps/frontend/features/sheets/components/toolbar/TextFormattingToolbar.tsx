'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';

interface TextFormattingToolbarProps {
  className?: string;
}

export function TextFormattingToolbar({ className }: TextFormattingToolbarProps) {
  const { focusedCell, getCellStyle, applyCellStyle } = useSheet();
  
  const currentStyle = focusedCell 
    ? getCellStyle(focusedCell.rowId, focusedCell.columnId) 
    : null;
  
  const isBold = currentStyle?.fontWeight === 'bold';
  const isItalic = currentStyle?.fontStyle === 'italic';
  const isUnderline = currentStyle?.textDecoration === 'underline';
  const isStrikethrough = currentStyle?.textDecoration === 'line-through';
  
  const handleToggleBold = () => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      fontWeight: isBold ? 'normal' : 'bold',
    });
  };
  
  const handleToggleItalic = () => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      fontStyle: isItalic ? 'normal' : 'italic',
    });
  };
  
  const handleToggleUnderline = () => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      textDecoration: isUnderline ? 'none' : 'underline',
    });
  };
  
  const handleToggleStrikethrough = () => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      textDecoration: isStrikethrough ? 'none' : 'line-through',
    });
  };
  
  const isDisabled = !focusedCell;
  
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isBold && "bg-accent text-accent-foreground"
            )}
            onClick={handleToggleBold}
            disabled={isDisabled}
          >
            <Bold className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Bold (Ctrl+B)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isItalic && "bg-accent text-accent-foreground"
            )}
            onClick={handleToggleItalic}
            disabled={isDisabled}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Italic (Ctrl+I)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isUnderline && "bg-accent text-accent-foreground"
            )}
            onClick={handleToggleUnderline}
            disabled={isDisabled}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Underline (Ctrl+U)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isStrikethrough && "bg-accent text-accent-foreground"
            )}
            onClick={handleToggleStrikethrough}
            disabled={isDisabled}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Strikethrough</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
