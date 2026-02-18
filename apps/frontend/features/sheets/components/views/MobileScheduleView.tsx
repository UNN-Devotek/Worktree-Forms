'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSheet } from '../../providers/SheetProvider';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { t } from '@/lib/i18n';
import { detectGanttColumns } from '@/lib/ganttUtils'; // Finding #5: shared utility

/**
 * Story 7.4 AC: "I see a vertical list of tasks sorted by Start Date"
 * "Gantt View is disabled or simplified for small screens (FR22.3)"
 *
 * Renders when viewport < 768px (controlled by GanttView's responsive wrapper).
 *
 * Finding #12: task items are now interactive buttons that open the row detail panel.
 */
export function MobileScheduleView() {
  const { data, columns, openDetailPanel } = useSheet();

  // Finding #5: shared column auto-detection utility (no more duplication)
  const { startDateCol, labelCol } = useMemo(() => {
    const { startDateCol, labelCol } = detectGanttColumns(columns);
    return { startDateCol, labelCol };
  }, [columns]);

  // Build sorted task list
  const tasks = useMemo(() => {
    if (!startDateCol) return [];

    return data
      .map(row => {
        const dateStr = row[startDateCol.id];
        const label = labelCol ? row[labelCol.id] : row.id;
        try {
          const date = dateStr ? parseISO(dateStr) : null;
          if (!date || !isValid(date)) return null;
          return { id: row.id, label: label || t('schedule.untitled', 'Untitled Task'), date, depth: row.depth || 0 };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => a!.date.getTime() - b!.date.getTime()) as Array<{
        id: string; label: string; date: Date; depth: number;
      }>;
  }, [data, startDateCol, labelCol]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const key = format(task.date, 'MMMM yyyy');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return Array.from(map.entries());
  }, [tasks]);

  if (!startDateCol) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-sm text-muted-foreground">
            {t('schedule.no_date_column', 'No date column found. Add a column with a date type to see the schedule.')}
          </p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-sm text-muted-foreground">
            {t('schedule.no_tasks', 'No tasks with valid dates found.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="p-4 space-y-6">
        {grouped.map(([month, monthTasks]) => (
          <div key={month}>
            {/* Month header */}
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">{month}</h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Task list */}
            <div className="space-y-2">
              {monthTasks.map(task => (
                // Finding #12: interactive button — tapping opens the row detail panel
                <button
                  key={task.id}
                  type="button"
                  className="w-full flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors text-left"
                  style={{ paddingLeft: `${12 + task.depth * 16}px` }}
                  onClick={() => openDetailPanel(task.id)}
                  aria-label={`${t('schedule.open_task', 'Open task')}: ${task.label}`}
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(task.date, 'EEE, MMM d')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
