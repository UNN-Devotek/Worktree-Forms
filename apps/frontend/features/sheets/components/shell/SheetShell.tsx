'use client';

import React from 'react';
import { SheetToolbar } from './SheetToolbar';

interface SheetShellProps {
  children: React.ReactNode;
  title: string;
}

export function SheetShell({ children, title }: SheetShellProps) {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden border-t text-sm">
      <SheetToolbar title={title} />
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
