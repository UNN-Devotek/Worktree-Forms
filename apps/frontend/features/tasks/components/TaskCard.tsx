'use client';

import React from 'react';
import { Paperclip, AtSign, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Task } from '../types';
import {
    TASK_TYPE_MAP, TASK_STATUSES, STATUS_MAP, PRIORITY_MAP,
    STATUS_BADGE_MAP, PRIORITY_BADGE_MAP,
} from '../constants';
import { apiClient } from '@/lib/api';

interface TaskCardProps {
    task: Task;
    onRefresh: () => void;
    onClick?: () => void;
    className?: string;
}

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

export function TaskCard({ task, onRefresh, onClick, className }: TaskCardProps) {
    const priority = PRIORITY_MAP[task.priority] ?? PRIORITY_MAP['MEDIUM'];
    const typeName = TASK_TYPE_MAP[task.taskType] ?? task.taskType;

    const assignees   = parseJsonArray(task.assignees);
    const attachments = parseJsonArray(task.attachments);
    const mentions    = parseJsonArray(task.mentions);

    const handleStatusChange = async (newStatus: string) => {
        await apiClient(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
        });
        onRefresh();
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'bg-card border rounded-lg p-3 flex flex-col gap-2 cursor-pointer',
                'hover:shadow-md hover:border-primary/30 transition-all',
                className,
            )}
        >
            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant={(PRIORITY_BADGE_MAP[task.priority] ?? 'info') as any}>
                    {priority.label}
                </Badge>
                <Badge variant="default">{typeName}</Badge>
                <Badge variant={(STATUS_BADGE_MAP[task.status] ?? 'pending') as any}>
                    {STATUS_MAP[task.status]?.label ?? task.status}
                </Badge>
            </div>

            {/* Title */}
            <p className="text-sm font-semibold leading-snug line-clamp-2">{task.title}</p>

            {/* Description */}
            {task.question && (
                <p className="text-xs text-muted-foreground line-clamp-2">{task.question}</p>
            )}

            {/* Assignees */}
            {assignees.length > 0 && (
                <div className="flex items-center gap-1">
                    {assignees.slice(0, 4).map((a: any, i: number) => (
                        <span
                            key={a.id ?? i}
                            title={a.name ?? ''}
                            className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center border border-background"
                        >
                            {initials(a.name)}
                        </span>
                    ))}
                    {assignees.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">+{assignees.length - 4}</span>
                    )}
                </div>
            )}

            {/* Dates */}
            {(task.startDate || task.endDate) && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'}
                    {' → '}
                    {task.endDate ? new Date(task.endDate).toLocaleDateString() : '—'}
                </div>
            )}

            {/* Footer: attachments + mentions + status dropdown */}
            <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {attachments.length > 0 && (
                        <span className="flex items-center gap-0.5">
                            <Paperclip className="h-3 w-3" />{attachments.length}
                        </span>
                    )}
                    {mentions.length > 0 && (
                        <span className="flex items-center gap-0.5">
                            <AtSign className="h-3 w-3" />{mentions.length}
                        </span>
                    )}
                </div>

                {/* Inline status dropdown */}
                <div onClick={e => e.stopPropagation()}>
                    <Select value={task.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="h-6 text-[10px] w-auto gap-1 px-2 border-none bg-transparent shadow-none focus:ring-0">
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
                </div>
            </div>
        </div>
    );
}
