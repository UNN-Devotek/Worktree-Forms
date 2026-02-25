'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TASK_TYPES, TASK_STATUSES, PRIORITY_LEVELS } from '../constants';
import { Task } from '../types';

export interface TaskFilters {
    type: string;
    priority: string;
    status: string;
    assignee: string;
    hasAttachments: string;
    sortBy: string;
    sortDir: 'asc' | 'desc';
}

export const DEFAULT_FILTERS: TaskFilters = {
    type: 'ALL',
    priority: 'ALL',
    status: 'ALL',
    assignee: 'ALL',
    hasAttachments: 'ALL',
    sortBy: 'created',
    sortDir: 'desc',
};

interface TaskFilterBarProps {
    filters: TaskFilters;
    onChange: (filters: TaskFilters) => void;
    tasks: Task[];
    hideType?: boolean;
}

function parseJsonArray(value: unknown): any[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
}

export function TaskFilterBar({ filters, onChange, tasks, hideType }: TaskFilterBarProps) {
    const set = (key: keyof TaskFilters, value: string) =>
        onChange({ ...filters, [key]: value });

    // Unique assignees from all tasks
    const assigneeMap = new Map<string, string>();
    tasks.forEach(t => {
        parseJsonArray(t.assignees).forEach((a: any) => {
            if (a.id && !assigneeMap.has(a.id)) assigneeMap.set(a.id, a.name ?? a.id);
        });
    });
    const assignees = Array.from(assigneeMap.entries());

    const isFiltered = filters.type !== 'ALL' || filters.priority !== 'ALL' ||
        filters.status !== 'ALL' || filters.assignee !== 'ALL' ||
        filters.hasAttachments !== 'ALL';

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Type */}
            {!hideType && (
                <Select value={filters.type} onValueChange={v => set('type', v)}>
                    <SelectTrigger className="h-8 w-auto text-xs gap-1 px-2.5">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="text-xs">All Types</SelectItem>
                        {TASK_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Priority */}
            <Select value={filters.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger className="h-8 w-auto text-xs gap-1 px-2.5">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL" className="text-xs">All Priorities</SelectItem>
                    {PRIORITY_LEVELS.map(p => (
                        <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Status */}
            <Select value={filters.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="h-8 w-auto text-xs gap-1 px-2.5">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                    {TASK_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Assignee */}
            <Select value={filters.assignee} onValueChange={v => set('assignee', v)}>
                <SelectTrigger className="h-8 w-auto text-xs gap-1 px-2.5">
                    <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL" className="text-xs">All Assignees</SelectItem>
                    {assignees.map(([id, name]) => (
                        <SelectItem key={id} value={id} className="text-xs">{name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Attachments */}
            <Select value={filters.hasAttachments} onValueChange={v => set('hasAttachments', v)}>
                <SelectTrigger className="h-8 w-auto text-xs gap-1 px-2.5">
                    <SelectValue placeholder="Files" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Any Files</SelectItem>
                    <SelectItem value="YES" className="text-xs">Has Files</SelectItem>
                    <SelectItem value="NO" className="text-xs">No Files</SelectItem>
                </SelectContent>
            </Select>

            {/* Clear filters */}
            {isFiltered && (
                <Button
                    variant="neutral"
                    size="sm"
                    className="h-8 text-xs gap-1 bg-transparent border-0 shadow-none hover:bg-accent text-muted-foreground"
                    onClick={() => onChange({ ...DEFAULT_FILTERS, sortBy: filters.sortBy, sortDir: filters.sortDir })}
                >
                    <X className="h-3 w-3" />
                    Clear
                </Button>
            )}
        </div>
    );
}

/* ── Sort a task array ────────────────────────────────────────────────── */

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATUS_ORDER: Record<string, number> = { DRAFT: 0, ACTIVE: 1, IN_PROGRESS: 2, COMPLETED: 3 };

export function sortTasks(tasks: Task[], sortBy: string, sortDir: 'asc' | 'desc'): Task[] {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...tasks].sort((a, b) => {
        switch (sortBy) {
            case 'title':
                return dir * a.title.localeCompare(b.title);
            case 'priority':
                return dir * ((PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
            case 'status':
                return dir * ((STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
            case 'type':
                return dir * a.taskType.localeCompare(b.taskType);
            case 'startDate': {
                const da = a.startDate ? new Date(a.startDate).getTime() : 0;
                const db = b.startDate ? new Date(b.startDate).getTime() : 0;
                return dir * (da - db);
            }
            case 'endDate': {
                const da = a.endDate ? new Date(a.endDate).getTime() : 0;
                const db = b.endDate ? new Date(b.endDate).getTime() : 0;
                return dir * (da - db);
            }
            case 'created':
            default:
                return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
    });
}

/* ── Apply filters + default sort to a task array ─────────────────────── */

export function applyFiltersAndSort(tasks: Task[], filters: TaskFilters): Task[] {
    let result = tasks;

    if (filters.type !== 'ALL') {
        result = result.filter(t => t.taskType === filters.type);
    }
    if (filters.priority !== 'ALL') {
        result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.status !== 'ALL') {
        result = result.filter(t => t.status === filters.status);
    }
    if (filters.assignee !== 'ALL') {
        result = result.filter(t => {
            const assignees = parseJsonArray(t.assignees);
            return assignees.some((a: any) => a.id === filters.assignee);
        });
    }
    if (filters.hasAttachments !== 'ALL') {
        result = result.filter(t => {
            const count = parseJsonArray(t.attachments).length;
            return filters.hasAttachments === 'YES' ? count > 0 : count === 0;
        });
    }

    return sortTasks(result, filters.sortBy, filters.sortDir);
}
