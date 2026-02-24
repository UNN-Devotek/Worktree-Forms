'use client';

import React from 'react';
import { SheetToolbar } from './SheetToolbar';
import { FormulaBar } from '../toolbar/FormulaBar';

interface SheetShellProps {
  children: React.ReactNode;
  title: string;
  onTitleChange?: (title: string) => void;
}

export function SheetShell({ children, title, onTitleChange }: SheetShellProps) {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden border-t text-sm">
      <SheetToolbar title={title} onTitleChange={onTitleChange} />
      <FormulaBar />
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
