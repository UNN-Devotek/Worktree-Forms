'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSheet } from '../../providers/SheetProvider';
import {
  format, parseISO, differenceInDays, startOfMonth, endOfMonth,
  eachDayOfInterval, addDays,
} from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { MobileScheduleView } from './MobileScheduleView';
import { t } from '@/lib/i18n';
import { detectGanttColumns } from '@/lib/ganttUtils'; // Finding #5: shared utility

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColumnMapping {
  startDateColumn: string | null;
  endDateColumn: string | null;
  labelColumn: string | null;
}

interface GanttTask {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  depth: number;
}

type DragMode = 'move' | 'resize-left' | 'resize-right';

interface DragState {
  taskId: string;
  mode: DragMode;
  startX: number;
  originalStart: Date;
  originalEnd: Date;
}

// ─── Responsive hook ──────────────────────────────────────────────────────────

// Finding #11 (R3): lazy initializer with SSR guard prevents hydration flash.
// Without this, the server renders isMobile=false (desktop), then the client
// switches to mobile — causing a visible layout flash on mobile devices.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GanttView() {
  const { data, columns, updateCells, sheetId } = useSheet();
  const isMobile = useIsMobile();

  // Finding #14: guard against SSR — sessionStorage is not available server-side.
  // Also use a stable key that only resolves once sheetId is known.
  const storageKey = sheetId ? `gantt-mapping-${sheetId}` : null;

  const [mapping, setMapping] = useState<ColumnMapping>(() => {
    if (typeof window === 'undefined' || !storageKey) {
      return { startDateColumn: null, endDateColumn: null, labelColumn: null };
    }
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { startDateColumn: null, endDateColumn: null, labelColumn: null };
  });

  // Finding #5: column auto-detection uses shared utility from ganttUtils.ts
  // Finding #9: mapping is included in deps; guard prevents infinite loop
  useEffect(() => {
    if (mapping.startDateColumn && mapping.endDateColumn) return;

    const { startDateCol, endDateCol, labelCol } = detectGanttColumns(columns);
    if (startDateCol && endDateCol) {
      setMapping({
        startDateColumn: startDateCol.id,
        endDateColumn: endDateCol.id,
        labelColumn: labelCol?.id || null,
      });
    }
    // mapping is intentionally omitted — we only want to re-run when columns change.
    // The guard `if (mapping.startDateColumn && mapping.endDateColumn) return;` prevents
    // re-running once configured. Including mapping would cause an infinite loop.
  }, [columns]); // eslint-disable-line react-hooks/exhaustive-deps -- see comment above

  // Finding #14: persist mapping changes to sessionStorage (only when key is known)
  useEffect(() => {
    if (storageKey && mapping.startDateColumn && mapping.endDateColumn) {
      try { sessionStorage.setItem(storageKey, JSON.stringify(mapping)); } catch { /* ignore */ }
    }
  }, [mapping, storageKey]);

  const { startDateColumn, endDateColumn, labelColumn } = mapping;
  const isMappingComplete = startDateColumn && endDateColumn;

  // Local overrides during drag (optimistic)
  const [dragOverrides, setDragOverrides] = useState<Record<string, { startDate: Date; endDate: Date }>>({});
  const dragState = useRef<DragState | null>(null);
  const liveOverrideRef = useRef<{ startDate: Date; endDate: Date } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse tasks, merging drag overrides
  const tasks = useMemo<GanttTask[]>(() => {
    if (!isMappingComplete) return [];

    return data
      .map((row: any) => {
        const override = dragOverrides[row.id];
        const startDateStr = row[startDateColumn];
        const endDateStr = row[endDateColumn];
        const label = labelColumn ? row[labelColumn] : row.id;

        try {
          const startDate = override?.startDate ?? (startDateStr ? parseISO(startDateStr) : null);
          const endDate = override?.endDate ?? (endDateStr ? parseISO(endDateStr) : null);

          if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return null;
          }

          return { id: row.id, label, startDate, endDate, depth: row.depth || 0 };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as GanttTask[];
  }, [data, startDateColumn, endDateColumn, labelColumn, isMappingComplete, dragOverrides]);

  // Timeline range
  const timelineRange = useMemo(() => {
    if (tasks.length === 0) return null;
    const allDates = tasks.flatMap(t => [t.startDate, t.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    const start = startOfMonth(minDate);
    const end = endOfMonth(maxDate);
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }, [tasks]);

  // Finding #11 (original): store totalDays in a ref so drag handlers never have a stale closure
  const totalDaysRef = useRef(1);
  // Finding #2 (R2): also store timelineRange in a ref so the null-check in onMouseMove is never stale
  const timelineRangeRef = useRef(timelineRange);
  // Finding #4 (R3): store updateCells in a ref so onMouseUp never captures a stale version
  // (e.g. if doc reconnects between mousedown and mouseup, updateCells identity changes)
  const updateCellsRef = useRef(updateCells);
  useEffect(() => {
    timelineRangeRef.current = timelineRange;
    updateCellsRef.current = updateCells;
    if (timelineRange) {
      totalDaysRef.current = differenceInDays(timelineRange.end, timelineRange.start) + 1;
    }
  }, [timelineRange, updateCells]);

  // ─── Drag logic ─────────────────────────────────────────────────────────────

  const handleBarMouseDown = useCallback((
    e: React.MouseEvent,
    task: GanttTask,
    mode: DragMode,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    dragState.current = {
      taskId: task.id,
      mode,
      startX: e.clientX,
      originalStart: task.startDate,
      originalEnd: task.endDate,
    };

    const onMouseMove = (ev: MouseEvent) => {
      const ds = dragState.current;
      // Finding #2: read timelineRange from ref — never stale, never leaks listeners
      if (!ds || !containerRef.current || !timelineRangeRef.current) return;

      const containerWidth = containerRef.current.getBoundingClientRect().width - 256;
      const pxPerDay = containerWidth / totalDaysRef.current;
      const deltaDays = Math.round((ev.clientX - ds.startX) / pxPerDay);

      let newStart = ds.originalStart;
      let newEnd = ds.originalEnd;

      if (ds.mode === 'move') {
        newStart = addDays(ds.originalStart, deltaDays);
        newEnd = addDays(ds.originalEnd, deltaDays);
      } else if (ds.mode === 'resize-left') {
        newStart = addDays(ds.originalStart, deltaDays);
        if (differenceInDays(newEnd, newStart) < 1) {
          newStart = addDays(newEnd, -1);
        }
      } else if (ds.mode === 'resize-right') {
        newEnd = addDays(ds.originalEnd, deltaDays);
        if (differenceInDays(newEnd, newStart) < 1) {
          newEnd = addDays(newStart, 1);
        }
      }

      setDragOverrides(prev => ({
        ...prev,
        [ds.taskId]: { startDate: newStart, endDate: newEnd },
      }));
      liveOverrideRef.current = { startDate: newStart, endDate: newEnd };
    };

    const onMouseUp = () => {
      const ds = dragState.current;
      if (ds) {
        const override = liveOverrideRef.current;
        if (override && startDateColumn && endDateColumn) {
          // Finding #4 (R3): read updateCells from ref — never stale even if doc reconnects mid-drag
          updateCellsRef.current([
            { rowId: ds.taskId, columnId: startDateColumn, value: format(override.startDate, 'yyyy-MM-dd') },
            { rowId: ds.taskId, columnId: endDateColumn, value: format(override.endDate, 'yyyy-MM-dd') },
          ]);
        }
        setDragOverrides(prev => {
          const next = { ...prev };
          delete next[ds.taskId];
          return next;
        });
        liveOverrideRef.current = null;
      }
      dragState.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    // Finding #2: dependency array no longer includes timelineRange — we read from ref
  }, [startDateColumn, endDateColumn, updateCells]);

  // Keyboard handler for bar body (ArrowLeft/Right = ±1 day, Shift = ±7 days)
  const handleBarKeyDown = useCallback((
    e: React.KeyboardEvent,
    task: GanttTask,
  ) => {
    if (!startDateColumn || !endDateColumn) return;
    const delta = e.shiftKey ? 7 : 1;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      updateCells([
        { rowId: task.id, columnId: startDateColumn, value: format(addDays(task.startDate, delta), 'yyyy-MM-dd') },
        { rowId: task.id, columnId: endDateColumn, value: format(addDays(task.endDate, delta), 'yyyy-MM-dd') },
      ]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      updateCells([
        { rowId: task.id, columnId: startDateColumn, value: format(addDays(task.startDate, -delta), 'yyyy-MM-dd') },
        { rowId: task.id, columnId: endDateColumn, value: format(addDays(task.endDate, -delta), 'yyyy-MM-dd') },
      ]);
    }
  }, [startDateColumn, endDateColumn, updateCells]);

  // ─── Story 7.4 AC: mobile shows vertical list, not Gantt grid ───────────────

  if (isMobile) {
    return <MobileScheduleView />;
  }

  // ─── Render guards ──────────────────────────────────────────────────────────

  if (!isMappingComplete) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5 p-8">
        <div className="max-w-2xl w-full bg-background border rounded-lg p-8 shadow-sm">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t('gantt.configure.title', 'Configure Gantt Chart')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('gantt.configure.description', 'Map your columns to display a timeline view of your tasks.')}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('gantt.configure.start_date', 'Start Date Column')}
              </label>
              <Select value={mapping.startDateColumn || ''} onValueChange={(val) => setMapping({ ...mapping, startDateColumn: val })}>
                <SelectTrigger><SelectValue placeholder={t('gantt.configure.select_start', 'Select start date column...')} /></SelectTrigger>
                <SelectContent>{columns.map((col: any) => <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('gantt.configure.end_date', 'End Date Column')}
              </label>
              <Select value={mapping.endDateColumn || ''} onValueChange={(val) => setMapping({ ...mapping, endDateColumn: val })}>
                <SelectTrigger><SelectValue placeholder={t('gantt.configure.select_end', 'Select end date column...')} /></SelectTrigger>
                <SelectContent>{columns.map((col: any) => <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('gantt.configure.label', 'Label Column (Optional)')}
              </label>
              <Select value={mapping.labelColumn || ''} onValueChange={(val) => setMapping({ ...mapping, labelColumn: val })}>
                <SelectTrigger><SelectValue placeholder={t('gantt.configure.select_label', 'Select label column...')} /></SelectTrigger>
                <SelectContent>{columns.map((col: any) => <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>)}</SelectContent>
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
          <h3 className="text-lg font-medium mb-2">{t('gantt.empty.title', 'No Valid Tasks')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('gantt.empty.description', 'No rows with valid date ranges found. Ensure your date columns contain valid dates.')}
          </p>
        </div>
      </div>
    );
  }

  if (!timelineRange) return null;

  const { start, end, days } = timelineRange;
  const totalDays = differenceInDays(end, start) + 1;

  return (
    <div className="h-full w-full overflow-auto bg-background select-none" ref={containerRef}>
      <div className="min-w-[1200px]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex">
            <div className="w-64 border-r p-3 font-medium bg-muted/30 shrink-0">
              {t('gantt.header.task', 'Task')}
            </div>
            <div className="flex-1 flex">
              {/*
                Finding #14 (R3): adaptive header.
                For ranges > 90 days, render month columns (not one div per day).
                A 5-year project would otherwise produce ~1,825 DOM nodes.
              */}
              {totalDays > 90 ? (
                // Month-level header for large ranges
                (() => {
                  const months: { label: string; days: number }[] = [];
                  let cur = start;
                  while (cur <= end) {
                    const monthEnd = endOfMonth(cur);
                    const clampedEnd = monthEnd < end ? monthEnd : end;
                    months.push({
                      label: format(cur, 'MMM yyyy'),
                      days: differenceInDays(clampedEnd, cur) + 1,
                    });
                    cur = addDays(monthEnd, 1);
                  }
                  return months.map((m, i) => (
                    <div
                      key={i}
                      className="border-r p-2 text-center text-xs font-semibold text-primary"
                      style={{ flex: `0 0 ${(m.days / totalDays) * 100}%` }}
                    >
                      {m.label}
                    </div>
                  ));
                })()
              ) : (
                // Day-level header for short ranges (≤ 90 days)
                days.map((day) => (
                  <div
                    key={format(day, 'yyyy-MM-dd')}
                    className="flex-1 min-w-[40px] p-2 text-center text-xs border-r"
                    style={{ flex: `0 0 ${100 / totalDays}%` }}
                  >
                    {format(day, 'd')}
                    {day.getDate() === 1 && (
                      <div className="font-semibold text-primary">{format(day, 'MMM')}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Task Rows */}
        <div>
          {tasks.map((task) => {
            const taskDuration = differenceInDays(task.endDate, task.startDate) + 1;
            const offsetDays = differenceInDays(task.startDate, start);
            const leftPercent = (offsetDays / totalDays) * 100;
            const widthPercent = (taskDuration / totalDays) * 100;
            const isDragging = !!dragOverrides[task.id];

            // Finding #11: build aria-label as a plain string, not a t() defaultValue template literal
            const barAriaLabel = `${t('gantt.bar.aria_prefix', 'Task')}: ${task.label}, ${taskDuration} ${t('gantt.bar.aria_days', 'days')}`;

            return (
              <div key={task.id} className="flex border-b hover:bg-muted/30 transition-colors">
                {/* Label column */}
                <div className="w-64 border-r p-3 flex items-center shrink-0">
                  <div style={{ paddingLeft: `${task.depth * 16}px` }} className="truncate text-sm">
                    {task.label || t('gantt.task.untitled', 'Untitled Task')}
                  </div>
                </div>

                {/* Timeline column */}
                <div className="flex-1 relative h-12 flex items-center">
                  <button
                    type="button"
                    className={[
                      'absolute h-7 rounded flex items-center text-xs text-primary-foreground font-medium transition-shadow',
                      isDragging
                        ? 'bg-primary/80 shadow-lg ring-2 ring-primary/40'
                        : 'bg-primary hover:shadow-md',
                    ].join(' ')}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(widthPercent, 2)}%`,
                      minWidth: '40px',
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    aria-label={barAriaLabel}
                    onMouseDown={(e) => handleBarMouseDown(e, task, 'move')}
                    onKeyDown={(e) => handleBarKeyDown(e, task)}
                  >
                    {/* Left resize handle */}
                    <button
                      type="button"
                      className="absolute left-0 top-0 h-full w-2 rounded-l flex items-center justify-center hover:bg-white/20 transition-colors"
                      style={{ cursor: 'ew-resize' }}
                      onMouseDown={(e) => handleBarMouseDown(e, task, 'resize-left')}
                      aria-label={t('gantt.handle.resize_start', 'Resize start date')}
                      title={t('gantt.handle.resize_start', 'Resize start date')}
                    >
                      <div className="w-0.5 h-3 bg-white/60 rounded-full" />
                    </button>

                    {/* Label */}
                    <span className="flex-1 text-center px-3 pointer-events-none truncate">
                      {taskDuration}{t('gantt.bar.days_suffix', 'd')}
                    </span>

                    {/* Right resize handle */}
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full w-2 rounded-r flex items-center justify-center hover:bg-white/20 transition-colors"
                      style={{ cursor: 'ew-resize' }}
                      onMouseDown={(e) => handleBarMouseDown(e, task, 'resize-right')}
                      aria-label={t('gantt.handle.resize_end', 'Resize end date')}
                      title={t('gantt.handle.resize_end', 'Resize end date')}
                    >
                      <div className="w-0.5 h-3 bg-white/60 rounded-full" />
                    </button>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
