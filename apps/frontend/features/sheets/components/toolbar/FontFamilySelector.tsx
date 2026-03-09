'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';
import { t } from '@/lib/i18n';

interface FontFamilySelectorProps {
  className?: string;
}

const FONT_LIST = [
  'Inter',
  'Arial',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
];

export function FontFamilySelector({ className }: FontFamilySelectorProps) {
  const {
    focusedCell,
    getCellStyle,
    applyCellStyle,
  } = useSheet();

  const currentStyle = focusedCell ? getCellStyle(focusedCell.rowId, focusedCell.columnId) : null;

  const currentFont = currentStyle?.fontFamily ?? 'Inter';

  const handleFontChange = (font: string) => {
    const style = { fontFamily: font };
    if (focusedCell) {
      applyCellStyle(focusedCell.rowId, focusedCell.columnId, style);
    }
  };

  const isDisabled = !focusedCell;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 gap-1 font-normal',
                className
              )}
              disabled={isDisabled}
            >
              <span
                className="truncate max-w-[100px] text-sm leading-none"
                style={{ fontFamily: currentFont }}
              >
                {currentFont}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('toolbar.font_family', 'Font family')}</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-48">
        {FONT_LIST.map((font) => (
          <DropdownMenuItem
            key={font}
            onClick={() => handleFontChange(font)}
            className={cn(
              'text-sm',
              currentFont === font && 'bg-accent text-accent-foreground'
            )}
            style={{ fontFamily: font }}
          >
            {font}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
