'use client';

import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

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
  
  // Finding #2 (R7): wrapped in useCallback with proper deps so the keyboard
  // shortcut useEffect always captures the latest handler identity.
  const handleToggleBold = useCallback(() => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      fontWeight: isBold ? 'normal' : 'bold',
    });
    toast.success(isBold ? t('toolbar.bold_removed', 'Bold removed') : t('toolbar.bold_applied', 'Bold applied'));
  }, [focusedCell, isBold, applyCellStyle]);

  const handleToggleItalic = useCallback(() => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      fontStyle: isItalic ? 'normal' : 'italic',
    });
    toast.success(isItalic ? t('toolbar.italic_removed', 'Italic removed') : t('toolbar.italic_applied', 'Italic applied'));
  }, [focusedCell, isItalic, applyCellStyle]);

  const handleToggleUnderline = useCallback(() => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      textDecoration: isUnderline ? 'none' : 'underline',
    });
    toast.success(isUnderline ? t('toolbar.underline_removed', 'Underline removed') : t('toolbar.underline_applied', 'Underline applied'));
  }, [focusedCell, isUnderline, applyCellStyle]);

  const handleToggleStrikethrough = useCallback(() => {
    if (!focusedCell) return;
    applyCellStyle(focusedCell.rowId, focusedCell.columnId, {
      textDecoration: isStrikethrough ? 'none' : 'line-through',
    });
    toast.success(isStrikethrough ? t('toolbar.strike_removed', 'Strikethrough removed') : t('toolbar.strike_applied', 'Strikethrough applied'));
  }, [focusedCell, isStrikethrough, applyCellStyle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handleToggleBold();
            break;
          case 'i':
            e.preventDefault();
            handleToggleItalic();
            break;
          case 'u':
            e.preventDefault();
            handleToggleUnderline();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleBold, handleToggleItalic, handleToggleUnderline]);
  
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
          <p>{t('toolbar.bold_shortcut', 'Bold (Ctrl+B)')}</p>
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
          <p>{t('toolbar.italic_shortcut', 'Italic (Ctrl+I)')}</p>
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
          <p>{t('toolbar.underline_shortcut', 'Underline (Ctrl+U)')}</p>
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
          <p>{t('toolbar.strikethrough', 'Strikethrough')}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
