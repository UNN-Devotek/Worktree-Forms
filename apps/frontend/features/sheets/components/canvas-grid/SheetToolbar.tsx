'use client';

import React from 'react';
import { Bold, Italic, Strikethrough, PaintBucket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';

interface SheetToolbarProps {
  onToggleStyle: (style: 'bold' | 'italic' | 'strike') => void;
}

export function SheetToolbar({ onToggleStyle }: SheetToolbarProps) {
  return (
    <div className="flex items-center gap-1 bg-background p-1 rounded-md border text-sm">
      <Toggle size="sm" aria-label="Toggle bold" onClick={() => onToggleStyle('bold')}>
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" aria-label="Toggle italic" onClick={() => onToggleStyle('italic')}>
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" aria-label="Toggle strikethrough" onClick={() => onToggleStyle('strike')}>
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <div className="w-px h-4 bg-border mx-1" />
      {/* Placeholder for Color */}
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <PaintBucket className="h-4 w-4" />
      </Button>
    </div>
  );
}
