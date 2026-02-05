'use client';

import React from 'react';
import { SheetShell } from '../shell/SheetShell';
import { RnCGridWrapper } from '../canvas-grid/RnCGridWrapper';
import { SheetProvider, useSheet } from '../../providers/SheetProvider';
import { RowDetailPanel } from '../panels/RowDetailPanel';
import { GanttView } from '../views/GanttView';
import { CalendarView } from '../views/CalendarView';
import { CardView } from '../views/CardView';
import { LayoutList, Calendar, Trello } from 'lucide-react';

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
  const { activeView, doc, token, user } = useSheet();

  const renderView = () => {
    switch (activeView) {
      case 'GANTT':
        return <GanttView />;
      case 'CALENDAR':
        return <CalendarView />;
      case 'CARD':
        return <CardView />;
      default:
        if (!doc || !token || !user) {
          return (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading sheet...</p>
              </div>
            </div>
          );
        }
        return <RnCGridWrapper sheetId={sheetId} token={token} user={user} />;
    }
  };

  return (
    <>
      <SheetShell title={title}>
        {renderView()}
      </SheetShell>
      <RowDetailPanel />
    </>
  );
}
