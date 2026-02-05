'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';

interface AlignmentSelectorProps {
  className?: string;
}

const alignmentOptions = [
  { value: 'left', icon: AlignLeft, label: 'Align Left' },
  { value: 'center', icon: AlignCenter, label: 'Align Center' },
  { value: 'right', icon: AlignRight, label: 'Align Right' },
] as const;

export function AlignmentSelector({ className }: AlignmentSelectorProps) {
  const { focusedCell, getCellStyle, applyCellStyle } = useSheet();
  
  const currentStyle = focusedCell 
    ? getCellStyle(focusedCell.rowId, focusedCell.columnId) 
    : null;
  
  const currentAlign = currentStyle?.textAlign || 'left';
  const CurrentIcon = alignmentOptions.find(o => o.value === currentAlign)?.icon || AlignLeft;
  
  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      textAlign: align,
    });
  };
  
  const isDisabled = !focusedCell;
  
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", className)}
              disabled={isDisabled}
            >
              <CurrentIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Text Alignment</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start">
        {alignmentOptions.map(({ value, icon: Icon, label }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleAlignChange(value)}
            className={cn(
              "gap-2",
              currentAlign === value && "bg-accent"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
