'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Task } from '../types';
import { TASK_TYPES, TASK_TYPE_MAP, TASK_TYPE_BUTTON_MAP } from '../constants';
import { TaskCard } from './TaskCard';
import { ColumnSortPopover, DEFAULT_COLUMN_SORT, type ColumnSort } from './ColumnSortPopover';
import { sortTasks } from './TaskFilterBar';

interface KanbanBoardProps {
    tasks: Task[];
    onDrillDown: (taskType: string) => void;
    onRefresh: () => void;
    onTaskClick: (task: Task) => void;
}

export function KanbanBoard({ tasks, onDrillDown, onRefresh, onTaskClick }: KanbanBoardProps) {
    const [columnSorts, setColumnSorts] = useState<Record<string, ColumnSort>>({});

    const active = tasks.filter(t => t.status !== 'COMPLETED');

    const grouped = TASK_TYPES.reduce<Record<string, Task[]>>((acc, type) => {
        const typeTasks = active.filter(t => t.taskType === type.value);
        if (typeTasks.length > 0) acc[type.value] = typeTasks;
        return acc;
    }, {});

    // Include unknown types
    active.forEach(t => {
        if (!grouped[t.taskType]) grouped[t.taskType] = [];
        if (!grouped[t.taskType].includes(t)) grouped[t.taskType].push(t);
    });

    const columns = Object.entries(grouped);

    const getSort = (col: string) => columnSorts[col] ?? DEFAULT_COLUMN_SORT;
    const setSort = (col: string, sort: ColumnSort) =>
        setColumnSorts(prev => ({ ...prev, [col]: sort }));

    if (columns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-lg">
                <p className="font-medium">No active tasks</p>
                <p className="text-sm">Create a task to get started.</p>
            </div>
        );
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
            {columns.map(([type, typeTasks]) => {
                const sort = getSort(type);
                const sorted = sortTasks(typeTasks, sort.sortBy, sort.sortDir);

                return (
                    <div key={type} className="flex-shrink-0 w-72 flex flex-col gap-2">
                        {/* Column header — clickable to drill down */}
                        <div className="flex items-center justify-between px-1 py-1 group">
                            <Button
                                variant={(TASK_TYPE_BUTTON_MAP[type] ?? 'default') as any}
                                size="sm"
                                onClick={() => onDrillDown(type)}
                            >
                                {TASK_TYPE_MAP[type] ?? type}
                            </Button>
                            <span className="flex items-center gap-1.5">
                                <ColumnSortPopover
                                    sort={sort}
                                    onSort={s => setSort(type, s)}
                                    hideFields={['type']}
                                />
                                <span className="text-xs text-muted-foreground bg-background border rounded-full px-2 py-0.5">
                                    {typeTasks.length}
                                </span>
                                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                    View all →
                                </span>
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="flex flex-col gap-2">
                            {sorted.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onRefresh={onRefresh}
                                    onClick={() => onTaskClick(task)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
