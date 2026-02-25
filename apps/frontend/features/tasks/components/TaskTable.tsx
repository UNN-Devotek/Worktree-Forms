'use client';

import React from 'react';
import { Task } from '../types';
import {
    TASK_TYPE_MAP, TASK_STATUSES, STATUS_MAP, PRIORITY_MAP,
    STATUS_BADGE_MAP, PRIORITY_BADGE_MAP, TASK_TYPE_BUTTON_MAP,
} from '../constants';
import { apiClient } from '@/lib/api';
import { ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

function parseJsonArray(value: unknown): any[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
}

function initials(name: string | null): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

interface TaskTableProps {
    tasks: Task[];
    onRefresh: () => void;
    onTaskClick?: (task: Task) => void;
}

export function TaskTable({ tasks, onRefresh, onTaskClick }: TaskTableProps) {
    const sorted = [...tasks].sort((a, b) => {
        if (a.taskType < b.taskType) return -1;
        if (a.taskType > b.taskType) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const changeStatus = async (taskId: string, status: string) => {
        await apiClient(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
        onRefresh();
    };

    if (sorted.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-lg">
                <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No tasks yet</p>
                <p className="text-sm">Create one to get started.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignees</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Created</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sorted.map(task => {
                    const priority    = PRIORITY_MAP[task.priority] ?? PRIORITY_MAP['MEDIUM'];
                    const assignees   = parseJsonArray(task.assignees);
                    const attachments = parseJsonArray(task.attachments);
                    return (
                        <TableRow
                            key={task.id}
                            className={onTaskClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                            onClick={() => onTaskClick?.(task)}
                        >
                            <TableCell className="text-muted-foreground">{task.number}</TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">{task.title}</TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                                <Button
                                    variant={(TASK_TYPE_BUTTON_MAP[task.taskType] ?? 'default') as any}
                                    size="sm"
                                    className="h-6 px-2 text-xs pointer-events-none"
                                >
                                    {TASK_TYPE_MAP[task.taskType] ?? task.taskType}
                                </Button>
                            </TableCell>
                            <TableCell>
                                <Badge variant={(PRIORITY_BADGE_MAP[task.priority] ?? 'info') as any}>
                                    {priority.label}
                                </Badge>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                                <Select value={task.status} onValueChange={v => changeStatus(task.id, v)}>
                                    <SelectTrigger className="h-7 w-auto text-xs gap-1 px-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TASK_STATUSES.map(s => (
                                            <SelectItem key={s.value} value={s.value} className="text-xs">
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-0.5">
                                    {assignees.slice(0, 3).map((a: any, i: number) => (
                                        <span key={i} title={a.name ?? ''} className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                                            {initials(a.name)}
                                        </span>
                                    ))}
                                    {assignees.length > 3 && <span className="text-xs text-muted-foreground self-center">+{assignees.length - 3}</span>}
                                </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{task.createdBy.name}</TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                {task.endDate ? new Date(task.endDate).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{attachments.length || '—'}</TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                {new Date(task.createdAt).toLocaleDateString()}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
