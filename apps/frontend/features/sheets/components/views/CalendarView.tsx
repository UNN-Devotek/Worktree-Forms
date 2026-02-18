'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSheet } from '../../providers/SheetProvider';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui/card';

interface ColumnMapping {
  dateColumn: string | null;
  labelColumn: string | null;
}

export function CalendarView() {
  const { data, columns, openDetailPanel } = useSheet();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateColumn: null,
    labelColumn: null,
  });

  // Finding #3 (R7): useEffect instead of useMemo — setState is a side-effect.
  // useMemo runs during render; calling setState inside it violates React rules
  // and can cause infinite re-renders in Strict Mode.
  useEffect(() => {
    if (mapping.dateColumn) return;
    const dateCol = columns.find(col =>
      col.type === 'DATE' ||
      /date|due|deadline|scheduled/i.test(col.label)
    );

    const labelCol = columns.find(col =>
      col.type === 'TEXT' ||
      /name|title|task|label|description/i.test(col.label)
    ) || columns[0];

    if (dateCol) {
      setMapping({
        dateColumn: dateCol.id,
        labelColumn: labelCol?.id || null,
      });
    }
  }, [columns]); // eslint-disable-line react-hooks/exhaustive-deps -- guard prevents loop

  const { dateColumn, labelColumn } = mapping;

  // Check if mapping is complete
  const isMappingComplete = !!dateColumn;

  // Parse tasks by date
  const tasksByDate = useMemo(() => {
    if (!isMappingComplete) return new Map();

    const map = new Map<string, any[]>();

    data.forEach(row => {
      const dateStr = row[dateColumn];
      if (!dateStr) return;

      try {
        const date = parseISO(dateStr);
        if (isNaN(date.getTime())) return;

        const dateKey = format(date, 'yyyy-MM-dd');
        const label = labelColumn ? row[labelColumn] : row.id;

        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }

        map.get(dateKey)!.push({
          id: row.id,
          label,
          date,
          row,
        });
      } catch (error) {
        // Skip invalid dates
      }
    });

    return map;
  }, [data, dateColumn, labelColumn, isMappingComplete]);

  // Get tasks for selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const tasksOnSelectedDate = tasksByDate.get(selectedDateKey) || [];

  // Tile content - show dots for dates with tasks
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const dateKey = format(date, 'yyyy-MM-dd');
    const tasks = tasksByDate.get(dateKey);

    if (!tasks || tasks.length === 0) return null;

    return (
      <div className="flex justify-center mt-1">
        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
      </div>
    );
  };

  if (!isMappingComplete) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5 p-8">
        <div className="max-w-2xl w-full bg-background border rounded-lg p-8 shadow-sm">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('calendar.configure_title', 'Configure Calendar View')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('calendar.configure_desc', 'Map a date column to display tasks on a monthly calendar.')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('calendar.date_column', 'Date Column')}</label>
              <Select value={mapping.dateColumn || ''} onValueChange={(val) => setMapping({ ...mapping, dateColumn: val })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('calendar.select_date', 'Select date column...')} />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('calendar.label_column', 'Label Column (Optional)')}</label>
              <Select value={mapping.labelColumn || ''} onValueChange={(val) => setMapping({ ...mapping, labelColumn: val })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('calendar.select_label', 'Select label column...')} />
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

  return (
    <div className="h-full w-full overflow-auto bg-background p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              tileContent={tileContent}
              className="w-full border-0 rounded-lg"
            />
          </Card>
        </div>

        {/* Tasks for selected date */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tasksOnSelectedDate.length} {tasksOnSelectedDate.length === 1 ? t('calendar.task_singular', 'task') : t('calendar.task_plural', 'tasks')}
              </p>
            </div>

            {tasksOnSelectedDate.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t('calendar.no_tasks', 'No tasks scheduled')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {tasksOnSelectedDate.map((task: any) => (
                  <button
                    type="button"
                    key={task.id}
                    onClick={() => openDetailPanel(task.id)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="font-medium text-sm mb-1">{task.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(task.date, 'h:mm a')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
