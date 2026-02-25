'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface FontSizeSelectorProps {
  className?: string;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

export function FontSizeSelector({ className }: FontSizeSelectorProps) {
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
    if (selectedFormattingRowIds.size > 0 && columns[0]) return getCellStyle([...selectedFormattingRowIds][0], columns[0].id);
    return null;
  })();

  const currentSize = currentStyle?.fontSize ?? 13;
  const [inputValue, setInputValue] = useState<string>(String(currentSize));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync the input display value when the cell selection changes
  useEffect(() => {
    setInputValue(currentStyle ? String(currentStyle.fontSize ?? 13) : '—');
  }, [focusedCell, selectedColumnIds, selectedFormattingRowIds, currentStyle]);

  const isDisabled = !focusedCell && selectedColumnIds.size === 0 && selectedFormattingRowIds.size === 0;

  const applySize = (size: number) => {
    if (isNaN(size) || size < 1 || size > 400) return;
    const style = { fontSize: size };
    if (focusedCell) {
      applyCellStyle(focusedCell.rowId, focusedCell.columnId, style);
    } else if (selectedColumnIds.size > 0) {
      selectedColumnIds.forEach(colId => applyColumnStyle(colId, style));
    } else if (selectedFormattingRowIds.size > 0) {
      selectedFormattingRowIds.forEach(rowId => applyRowStyle(rowId, style));
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 400) {
      applySize(parsed);
      setInputValue(String(parsed));
    } else {
      // Revert to the current committed size
      setInputValue(currentStyle ? String(currentStyle.fontSize ?? 13) : '13');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setInputValue(currentStyle ? String(currentStyle.fontSize ?? 13) : '13');
      inputRef.current?.blur();
    }
  };

  const handleDropdownSelect = (size: number) => {
    applySize(size);
    setInputValue(String(size));
    setIsDropdownOpen(false);
  };

  return (
    <div className={cn('flex items-center h-8', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center border rounded-md h-8 overflow-hidden focus-within:ring-1 focus-within:ring-ring">
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              onFocus={(e) => e.target.select()}
              disabled={isDisabled}
              className={cn(
                'h-7 w-10 border-0 text-center text-sm px-1 py-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
                isDisabled && 'text-muted-foreground'
              )}
              aria-label={t('toolbar.font_size', 'Font size')}
            />
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-6 rounded-none border-l border-border shrink-0 px-0"
                  disabled={isDisabled}
                  aria-label={t('toolbar.font_size_list', 'Font size list')}
                  tabIndex={-1}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-20 max-h-64 overflow-y-auto">
                {FONT_SIZES.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => handleDropdownSelect(size)}
                    className={cn(
                      'text-sm justify-center',
                      currentSize === size && 'bg-accent text-accent-foreground font-medium'
                    )}
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('toolbar.font_size', 'Font size')}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
