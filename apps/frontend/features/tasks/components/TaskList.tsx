'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Loader2, List, LayoutGrid } from 'lucide-react';
import { Task } from '../types';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskFilterBar, applyFiltersAndSort, DEFAULT_FILTERS, type TaskFilters } from './TaskFilterBar';
import { KanbanBoard } from './KanbanBoard';
import { TypeKanban } from './TypeKanban';
import { TaskTable } from './TaskTable';

interface TaskListProps {
    projectId: string;
}

export const TaskList: React.FC<TaskListProps> = ({ projectId }) => {
    const [tasks,        setTasks]        = useState<Task[]>([]);
    const [isLoading,    setIsLoading]    = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [view,         setView]         = useState<'kanban' | 'table'>('kanban');
    const [drillType,    setDrillType]    = useState<string | null>(null);
    const [filters,      setFilters]      = useState<TaskFilters>(DEFAULT_FILTERS);

    // Detail modal
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [detailOpen,   setDetailOpen]   = useState(false);

    // Edit mode (reuses CreateTaskModal)
    const [editTask, setEditTask] = useState<Task | null>(null);

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient<{ success: boolean; data: Task[] }>(`/api/projects/${projectId}/tasks`);
            if (res.success && res.data) setTasks(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    // Keep selectedTask in sync with refreshed tasks list
    useEffect(() => {
        if (selectedTask) {
            const updated = tasks.find(t => t.id === selectedTask.id);
            if (updated) setSelectedTask(updated);
        }
    }, [tasks, selectedTask]);

    const filteredTasks = useMemo(
        () => applyFiltersAndSort(tasks, filters),
        [tasks, filters],
    );

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setDetailOpen(true);
    };

    const handleEdit = (task: Task) => {
        setDetailOpen(false);
        setEditTask(task);
        setIsCreateOpen(true);
    };

    const handleCreateClose = () => {
        setIsCreateOpen(false);
        setEditTask(null);
    };

    const handleCreateSuccess = () => {
        handleCreateClose();
        fetchTasks();
    };

    return (
        <div className="flex flex-col gap-4 h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold">Tasks</h2>
                <div className="flex items-center gap-2">
                    {!drillType && (
                        <div className="flex items-center border rounded-md overflow-hidden">
                            <button
                                onClick={() => setView('kanban')}
                                className={`p-1.5 transition-colors ${view === 'kanban' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                                title="Kanban view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setView('table')}
                                className={`p-1.5 transition-colors ${view === 'table' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                                title="Table view"
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <Button onClick={() => { setEditTask(null); setIsCreateOpen(true); }}>
                        New Task
                    </Button>
                </div>
            </div>

            {/* Filter bar — shown when not drilled down */}
            {!drillType && (
                <TaskFilterBar
                    filters={filters}
                    onChange={setFilters}
                    tasks={tasks}
                />
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin h-6 w-6" />
                    </div>
                ) : drillType ? (
                    <TypeKanban
                        tasks={filteredTasks}
                        taskType={drillType}
                        onBack={() => setDrillType(null)}
                        onRefresh={fetchTasks}
                        onTaskClick={handleTaskClick}
                    />
                ) : view === 'kanban' ? (
                    <KanbanBoard
                        tasks={filteredTasks}
                        onDrillDown={setDrillType}
                        onRefresh={fetchTasks}
                        onTaskClick={handleTaskClick}
                    />
                ) : (
                    <TaskTable
                        tasks={filteredTasks}
                        onRefresh={fetchTasks}
                        onTaskClick={handleTaskClick}
                    />
                )}
            </div>

            {/* Detail modal */}
            <TaskDetailModal
                task={selectedTask}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onEdit={handleEdit}
                onRefresh={fetchTasks}
            />

            {/* Create / Edit modal */}
            <CreateTaskModal
                projectId={projectId}
                isOpen={isCreateOpen}
                onClose={handleCreateClose}
                onSuccess={handleCreateSuccess}
                editTask={editTask}
            />
        </div>
    );
};
