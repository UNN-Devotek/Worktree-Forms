'use client';

import React, { useState } from 'react';
import { ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DndContext, DragOverlay, closestCenter,
    useSensor, useSensors, PointerSensor,
    useDroppable,
    useDraggable,
    type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { Task } from '../types';
import { TASK_TYPE_MAP, KANBAN_STATUS_COLUMNS, STATUS_MAP, STATUS_BADGE_MAP } from '../constants';
import { TaskCard } from './TaskCard';
import { TaskTable } from './TaskTable';
import { TaskFilterBar, applyFiltersAndSort, sortTasks, DEFAULT_FILTERS, type TaskFilters } from './TaskFilterBar';
import { ColumnSortPopover, DEFAULT_COLUMN_SORT, type ColumnSort } from './ColumnSortPopover';
import { apiClient } from '@/lib/api';

interface TypeKanbanProps {
    tasks: Task[];
    taskType: string;
    onBack: () => void;
    onRefresh: () => void;
    onTaskClick: (task: Task) => void;
}

/* ── Droppable column wrapper ─────────────────────────────────────────── */
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex flex-col gap-2 flex-1 min-h-[200px] rounded-lg p-2 transition-colors',
                isOver && 'bg-primary/5 ring-2 ring-primary/20',
            )}
        >
            {children}
        </div>
    );
}

/* ── Draggable card wrapper ───────────────────────────────────────────── */
function DraggableCard({
    task, onRefresh, onTaskClick,
}: {
    task: Task;
    onRefresh: () => void;
    onTaskClick: (task: Task) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { task },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn('touch-none', isDragging && 'opacity-30')}
        >
            <TaskCard
                task={task}
                onRefresh={onRefresh}
                onClick={() => onTaskClick(task)}
            />
        </div>
    );
}

/* ── Main component ───────────────────────────────────────────────────── */
export function TypeKanban({ tasks, taskType, onBack, onRefresh, onTaskClick }: TypeKanbanProps) {
    const typeTasks = tasks.filter(t => t.taskType === taskType);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [drillView, setDrillView] = useState<'kanban' | 'list'>('kanban');
    const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
    const [columnSorts, setColumnSorts] = useState<Record<string, ColumnSort>>({});

    const filteredTypeTasks = React.useMemo(
        () => applyFiltersAndSort(typeTasks, filters),
        [typeTasks, filters],
    );

    const getSort = (col: string) => columnSorts[col] ?? DEFAULT_COLUMN_SORT;
    const setSort = (col: string, sort: ColumnSort) =>
        setColumnSorts(prev => ({ ...prev, [col]: sort }));

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        const task = event.active.data.current?.task as Task | undefined;
        setActiveTask(task ?? null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const task = active.data.current?.task as Task | undefined;
        if (!task) return;

        const newStatus = over.id as string;
        if (task.status === newStatus) return;

        try {
            await apiClient(`/api/tasks/${task.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            onRefresh();
        } catch (err) {
            console.error('Failed to update task status', err);
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full pt-1">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="neutral"
                    size="sm"
                    onClick={onBack}
                    className="gap-1.5"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <h3 className="font-semibold text-lg">{TASK_TYPE_MAP[taskType] ?? taskType}</h3>
                <span className="text-sm text-muted-foreground">
                    {typeTasks.length} task{typeTasks.length !== 1 ? 's' : ''}
                </span>

                {/* View toggle */}
                <div className="flex items-center border rounded-md overflow-hidden ml-auto">
                    <button
                        onClick={() => setDrillView('kanban')}
                        className={`p-1.5 transition-colors ${drillView === 'kanban' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                        title="Kanban view"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setDrillView('list')}
                        className={`p-1.5 transition-colors ${drillView === 'list' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                        title="List view"
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <TaskFilterBar
                filters={filters}
                onChange={setFilters}
                tasks={typeTasks}
                hideType
            />

            {/* List view */}
            {drillView === 'list' ? (
                <TaskTable
                    tasks={filteredTypeTasks}
                    onRefresh={onRefresh}
                    onTaskClick={onTaskClick}
                />
            ) : (
                /* Kanban columns */
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 overflow-x-auto p-1 pb-4 min-h-[400px]">
                        {KANBAN_STATUS_COLUMNS.map(status => {
                            const col = STATUS_MAP[status];
                            const colSort = getSort(status);
                            const colTasks = sortTasks(
                                filteredTypeTasks.filter(t => t.status === status),
                                colSort.sortBy,
                                colSort.sortDir,
                            );

                            return (
                                <div key={status} className="flex-shrink-0 w-72 flex flex-col gap-2">
                                    {/* Column header */}
                                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/60">
                                        <Badge variant={(STATUS_BADGE_MAP[status] ?? 'pending') as any}>
                                            {col.label}
                                        </Badge>
                                        <span className="flex items-center gap-1.5">
                                            <ColumnSortPopover
                                                sort={colSort}
                                                onSort={s => setSort(status, s)}
                                                hideFields={['status', 'type']}
                                            />
                                            <span className="text-xs border rounded-full px-2 py-0.5 bg-background text-muted-foreground">
                                                {colTasks.length}
                                            </span>
                                        </span>
                                    </div>

                                    {/* Droppable area */}
                                    <DroppableColumn id={status}>
                                        {colTasks.length === 0 ? (
                                            <div className="border border-dashed rounded-lg p-6 text-center text-xs text-muted-foreground">
                                                Drop tasks here
                                            </div>
                                        ) : (
                                            colTasks.map(task => (
                                                <DraggableCard
                                                    key={task.id}
                                                    task={task}
                                                    onRefresh={onRefresh}
                                                    onTaskClick={onTaskClick}
                                                />
                                            ))
                                        )}
                                    </DroppableColumn>
                                </div>
                            );
                        })}
                    </div>

                    {/* Drag overlay — follows the cursor */}
                    <DragOverlay>
                        {activeTask ? (
                            <div className="rotate-2 shadow-xl opacity-90 w-72">
                                <TaskCard
                                    task={activeTask}
                                    onRefresh={() => {}}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}
        </div>
    );
}
