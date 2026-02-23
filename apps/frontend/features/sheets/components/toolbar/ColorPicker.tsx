'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';
import { t } from '@/lib/i18n';

interface ColorPickerProps {
  className?: string;
}

const PRESET_COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFFFFF', // White
];

export function ColorPicker({ className }: ColorPickerProps) {
  const {
    focusedCell, getCellStyle, applyCellStyle,
    selectedColumnId, selectedFormattingRowId,
    applyColumnStyle, applyRowStyle,
    data, columns,
  } = useSheet();
  const [isOpen, setIsOpen] = useState(false);

  const currentStyle = (() => {
    if (focusedCell) return getCellStyle(focusedCell.rowId, focusedCell.columnId);
    if (selectedColumnId && data[0]) return getCellStyle(data[0].id, selectedColumnId);
    if (selectedFormattingRowId && columns[0]) return getCellStyle(selectedFormattingRowId, columns[0].id);
    return null;
  })();

  const currentColor = currentStyle?.color || '#000000';

  const handleColorChange = (color: string) => {
    const style = { color };
    if (focusedCell) {
      applyCellStyle(focusedCell.rowId, focusedCell.columnId, style);
    } else if (selectedColumnId) {
      applyColumnStyle(selectedColumnId, style);
    } else if (selectedFormattingRowId) {
      applyRowStyle(selectedFormattingRowId, style);
    }
  };

  const handlePresetClick = (color: string) => {
    handleColorChange(color);
    setIsOpen(false);
  };

  const isDisabled = !focusedCell && !selectedColumnId && !selectedFormattingRowId;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 relative", className)}
              disabled={isDisabled}
            >
              <Palette className="h-4 w-4" />
              {!isDisabled && (
                <div
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
                  style={{ backgroundColor: currentColor }}
                />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('toolbar.text_color', 'Text Color')}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {t('toolbar.custom_color', 'Custom Color')}
            </label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-9 w-16 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={currentColor.toUpperCase()}
                onChange={(e) => {
                  const value = e.target.value;
                  // Finding #5 (R7): only accept complete 3- or 6-digit hex.
                  // Partial values like '#F' are invalid CSS and would propagate
                  // broken styles to all peers via Yjs.
                  if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(value)) {
                    handleColorChange(value);
                  }
                }}
                className="h-9 flex-1 font-mono text-sm"
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {t('toolbar.preset_colors', 'Preset Colors')}
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handlePresetClick(color)}
                  className={cn(
                    "w-7 h-7 rounded-md border-2 transition-all hover:scale-110",
                    currentColor.toUpperCase() === color.toUpperCase()
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Select color ${color}`}
                >
                  {color === '#FFFFFF' && (
                    <div className="w-full h-full rounded-sm border border-gray-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
