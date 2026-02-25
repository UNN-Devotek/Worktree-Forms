'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter } from 'lucide-react';
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

interface BackgroundColorPickerProps {
  className?: string;
}

const PRESET_COLORS: { value: string | undefined; label: string; display: string }[] = [
  { value: '#FFFF00', label: 'Yellow',       display: '#FFFF00' },
  { value: '#90EE90', label: 'Light Green',  display: '#90EE90' },
  { value: '#ADD8E6', label: 'Light Blue',   display: '#ADD8E6' },
  { value: '#FFB6C1', label: 'Pink',         display: '#FFB6C1' },
  { value: '#FFA500', label: 'Orange',       display: '#FFA500' },
  { value: '#E6E6FA', label: 'Lavender',     display: '#E6E6FA' },
  { value: '#ffffff', label: 'White',        display: '#ffffff' },
  { value: undefined, label: 'No fill',      display: 'transparent' },
];

// Returns a CSS-safe color for the color input (undefined/transparent → #ffffff)
function toColorInputValue(color: string | undefined): string {
  if (!color || color === 'transparent') return '#ffffff';
  return color;
}

export function BackgroundColorPicker({ className }: BackgroundColorPickerProps) {
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

  const [isOpen, setIsOpen] = useState(false);

  const currentStyle = (() => {
    if (focusedCell) return getCellStyle(focusedCell.rowId, focusedCell.columnId);
    if (selectedColumnIds.size > 0 && data[0]) return getCellStyle(data[0].id, [...selectedColumnIds][0]);
    if (selectedFormattingRowIds.size > 0 && columns[0]) return getCellStyle([...selectedFormattingRowIds][0], columns[0].id);
    return null;
  })();

  const currentBg = currentStyle?.backgroundColor;

  const applyBackground = (color: string | undefined) => {
    const style = { backgroundColor: color };
    if (focusedCell) {
      applyCellStyle(focusedCell.rowId, focusedCell.columnId, style);
    } else if (selectedColumnIds.size > 0) {
      selectedColumnIds.forEach(colId => applyColumnStyle(colId, style));
    } else if (selectedFormattingRowIds.size > 0) {
      selectedFormattingRowIds.forEach(rowId => applyRowStyle(rowId, style));
    }
  };

  const handleColorInputChange = (value: string) => {
    applyBackground(value);
  };

  const handleHexInputChange = (value: string) => {
    // Only commit complete 3- or 6-digit hex values to prevent broken styles
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)) {
      applyBackground(value);
    }
  };

  const handlePresetClick = (color: string | undefined) => {
    applyBackground(color);
    setIsOpen(false);
  };

  const isDisabled = !focusedCell && selectedColumnIds.size === 0 && selectedFormattingRowIds.size === 0;

  // Bar beneath the icon reflects the current background (checkered when transparent/none)
  const barStyle: React.CSSProperties =
    currentBg && currentBg !== 'transparent'
      ? { backgroundColor: currentBg }
      : {
          backgroundImage:
            'linear-gradient(45deg, #ccc 25%, transparent 25%), ' +
            'linear-gradient(-45deg, #ccc 25%, transparent 25%), ' +
            'linear-gradient(45deg, transparent 75%, #ccc 75%), ' +
            'linear-gradient(-45deg, transparent 75%, #ccc 75%)',
          backgroundSize: '4px 4px',
          backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
        };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8 relative', className)}
              disabled={isDisabled}
              aria-label={t('toolbar.highlight_color', 'Highlight color')}
            >
              <Highlighter className="h-4 w-4" />
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full border border-border/40"
                style={barStyle}
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('toolbar.highlight_color', 'Highlight color')}</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          {/* Custom color inputs */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {t('toolbar.custom_color', 'Custom Color')}
            </label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={toColorInputValue(currentBg)}
                onChange={(e) => handleColorInputChange(e.target.value)}
                className="h-9 w-16 p-1 cursor-pointer"
                aria-label={t('toolbar.color_picker_input', 'Color picker')}
              />
              <Input
                type="text"
                value={currentBg && currentBg !== 'transparent' ? currentBg.toUpperCase() : ''}
                onChange={(e) => handleHexInputChange(e.target.value)}
                className="h-9 flex-1 font-mono text-sm"
                placeholder="#RRGGBB"
                maxLength={7}
                aria-label={t('toolbar.hex_color_input', 'Hex color value')}
              />
            </div>
          </div>

          {/* Preset swatches */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {t('toolbar.preset_colors', 'Preset Colors')}
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((preset) => {
                const isActive =
                  preset.value === undefined
                    ? !currentBg || currentBg === 'transparent'
                    : currentBg?.toUpperCase() === preset.value.toUpperCase();

                const swatchStyle: React.CSSProperties =
                  preset.display === 'transparent'
                    ? {
                        backgroundImage:
                          'linear-gradient(45deg, #ccc 25%, transparent 25%), ' +
                          'linear-gradient(-45deg, #ccc 25%, transparent 25%), ' +
                          'linear-gradient(45deg, transparent 75%, #ccc 75%), ' +
                          'linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                        backgroundSize: '6px 6px',
                        backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                      }
                    : { backgroundColor: preset.display };

                return (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset.value)}
                    className={cn(
                      'w-7 h-7 rounded-md border-2 transition-all hover:scale-110',
                      isActive
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-muted-foreground'
                    )}
                    style={swatchStyle}
                    title={preset.label}
                    aria-label={`Select background color: ${preset.label}`}
                  />
                );
              })}
            </div>
          </div>

          {/* None / clear button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => handlePresetClick(undefined)}
          >
            {t('toolbar.no_fill', 'None (clear fill)')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
