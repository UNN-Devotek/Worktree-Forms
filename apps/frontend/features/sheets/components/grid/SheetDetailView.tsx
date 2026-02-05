'use client';

import React from 'react';
import { SheetShell } from '../shell/SheetShell';
import { RnCGridWrapper } from '../canvas-grid/RnCGridWrapper';
import { SheetProvider, useSheet } from '../../providers/SheetProvider';
import { RowDetailPanel } from '../panels/RowDetailPanel';
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
        return (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/5">
            <div className="text-center p-8 border-2 border-dashed rounded-lg max-w-md">
              <LayoutList className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">Gantt Chart View</h3>
              <p className="mt-2">Visual timeline for your project tasks. Map "Start Date" and "End Date" columns to enable this view.</p>
            </div>
          </div>
        );
      case 'CALENDAR':
        return (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/5">
            <div className="text-center p-8 border-2 border-dashed rounded-lg max-w-md">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">Calendar View</h3>
              <p className="mt-2">Monthly schedule of your tasks. Map a "Date" column to enable this view.</p>
            </div>
          </div>
        );
      case 'CARD':
        return (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/5">
            <div className="text-center p-8 border-2 border-dashed rounded-lg max-w-md">
              <Trello className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">Card View</h3>
              <p className="mt-2">Kanban-style board for your workflow. Map a "Status" or "Category" column to enable this view.</p>
            </div>
          </div>
        );
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
