'use client';

import React, { useState, useMemo } from 'react';
import { useSheet } from '../../providers/SheetProvider';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar as CalendarIcon } from 'lucide-react';

interface ColumnMapping {
  startDateColumn: string | null;
  endDateColumn: string | null;
  labelColumn: string | null;
}

export function GanttView() {
  const { data, columns } = useSheet();
  const [mapping, setMapping] = useState<ColumnMapping>({
    startDateColumn: null,
    endDateColumn: null,
    labelColumn: null,
  });

  // Auto-detect date columns on mount
  useMemo(() => {
    const dateColumns = columns.filter(col =>
      col.type === 'DATE' ||
      /date|start|begin|due|end|finish/i.test(col.label)
    );

    const startCol = dateColumns.find(col => /start|begin/i.test(col.label)) || dateColumns[0];
    const endCol = dateColumns.find(col => /end|finish|due/i.test(col.label)) || dateColumns[1];
    const labelCol = columns.find(col =>
      col.type === 'TEXT' ||
      /name|title|task|label/i.test(col.label)
    ) || columns[0];

    if (startCol && endCol) {
      setMapping({
        startDateColumn: startCol.id,
        endDateColumn: endCol.id,
        labelColumn: labelCol?.id || null,
      });
    }
  }, [columns]);

  const { startDateColumn, endDateColumn, labelColumn } = mapping;

  // Check if mapping is complete
  const isMappingComplete = startDateColumn && endDateColumn;

  // Parse and validate dates
  const tasks = useMemo(() => {
    if (!isMappingComplete) return [];

    return data
      .map(row => {
        const startDateStr = row[startDateColumn];
        const endDateStr = row[endDateColumn];
        const label = labelColumn ? row[labelColumn] : row.id;

        try {
          const startDate = startDateStr ? parseISO(startDateStr) : null;
          const endDate = endDateStr ? parseISO(endDateStr) : null;

          if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return null;
          }

          return {
            id: row.id,
            label,
            startDate,
            endDate,
            depth: row.depth || 0,
          };
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);
  }, [data, startDateColumn, endDateColumn, labelColumn, isMappingComplete]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    if (tasks.length === 0) return null;

    const allDates = tasks.flatMap(task => [task!.startDate, task!.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d!.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d!.getTime())));

    const start = startOfMonth(minDate);
    const end = endOfMonth(maxDate);

    return { start, end, days: eachDayOfInterval({ start, end }) };
  }, [tasks]);

  if (!isMappingComplete) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5 p-8">
        <div className="max-w-2xl w-full bg-background border rounded-lg p-8 shadow-sm">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Configure Gantt Chart</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Map your columns to display a timeline view of your tasks.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date Column</label>
              <Select value={mapping.startDateColumn || ''} onValueChange={(val) => setMapping({ ...mapping, startDateColumn: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start date column..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date Column</label>
              <Select value={mapping.endDateColumn || ''} onValueChange={(val) => setMapping({ ...mapping, endDateColumn: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select end date column..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Label Column (Optional)</label>
              <Select value={mapping.labelColumn || ''} onValueChange={(val) => setMapping({ ...mapping, labelColumn: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select label column..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5">
        <div className="text-center p-8">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium mb-2">No Valid Tasks</h3>
          <p className="text-sm text-muted-foreground">
            No rows with valid date ranges found. Ensure your date columns contain valid dates.
          </p>
        </div>
      </div>
    );
  }

  if (!timelineRange) return null;

  const { start, end, days } = timelineRange;
  const totalDays = differenceInDays(end, start) + 1;

  return (
    <div className="h-full w-full overflow-auto bg-background">
      <div className="min-w-[1200px]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex">
            <div className="w-64 border-r p-3 font-medium bg-muted/30">Task</div>
            <div className="flex-1 flex">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className="flex-1 min-w-[40px] p-2 text-center text-xs border-r"
                  style={{ flex: `0 0 ${100 / totalDays}%` }}
                >
                  {format(day, 'd')}
                  {day.getDate() === 1 && (
                    <div className="font-semibold text-primary">{format(day, 'MMM')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Rows */}
        <div>
          {tasks.map((task) => {
            const taskStart = task!.startDate;
            const taskEnd = task!.endDate;
            const taskDuration = differenceInDays(taskEnd, taskStart) + 1;
            const offsetDays = differenceInDays(taskStart, start);
            const leftPercent = (offsetDays / totalDays) * 100;
            const widthPercent = (taskDuration / totalDays) * 100;

            return (
              <div key={task!.id} className="flex border-b hover:bg-muted/30 transition-colors">
                <div className="w-64 border-r p-3 flex items-center">
                  <div style={{ paddingLeft: `${task!.depth * 16}px` }} className="truncate text-sm">
                    {task!.label || 'Untitled Task'}
                  </div>
                </div>
                <div className="flex-1 relative h-12 flex items-center">
                  <div
                    className="absolute h-6 bg-primary rounded flex items-center justify-center text-xs text-primary-foreground font-medium"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      minWidth: '40px',
                    }}
                  >
                    {taskDuration}d
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
