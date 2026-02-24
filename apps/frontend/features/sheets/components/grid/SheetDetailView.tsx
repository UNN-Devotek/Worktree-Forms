'use client';

import React, { useState, useCallback } from 'react';
import { SheetShell } from '../shell/SheetShell';
import { renameSheet } from '../../server/sheet-actions';
import { LiveTable } from '../LiveTable';
import { SheetProvider, useSheet } from '../../providers/SheetProvider';
import { RowDetailPanel } from '../panels/RowDetailPanel';
import { GanttView, CalendarView, CardView } from '../views';

interface SheetDetailViewProps {
  sheetId: string;
  title: string;
  token: string;
  user: { name: string; color: string };
}

export function SheetDetailView({ sheetId, title, token, user }: SheetDetailViewProps) {
  return (
    <SheetProvider sheetId={sheetId} token={token} user={user}>
      <SheetDetailContent title={title} sheetId={sheetId} />
    </SheetProvider>
  );
}

function SheetDetailContent({ title, sheetId }: { title: string; sheetId: string }) {
  const { activeView, doc } = useSheet();
  const [currentTitle, setCurrentTitle] = useState(title);

  const handleTitleChange = useCallback(async (newTitle: string) => {
    setCurrentTitle(newTitle);
    try {
      await renameSheet(sheetId, newTitle);
    } catch (err) {
      console.error('Failed to rename sheet:', err);
      setCurrentTitle(title); // revert on error
    }
  }, [sheetId, title]);

  const renderView = () => {
    switch (activeView) {
      case 'GANTT':
        return <GanttView />;
      case 'CALENDAR':
        return <CalendarView />;
      case 'CARD':
        return <CardView />;
      default:
        if (!doc) {
          return (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading sheet...</p>
              </div>
            </div>
          );
        }
        return <LiveTable documentId={sheetId} />;
    }
  };

  return (
    <>
      <SheetShell title={currentTitle} onTitleChange={handleTitleChange}>
        {renderView()}
      </SheetShell>
      <RowDetailPanel />
    </>
  );
}
