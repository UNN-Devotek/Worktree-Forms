'use client';

import React from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Pencil, Calendar, Paperclip, AtSign, User } from 'lucide-react';
import { Task } from '../types';
import {
    TASK_TYPE_MAP, TASK_STATUSES, STATUS_MAP, PRIORITY_MAP,
    STATUS_BADGE_MAP, PRIORITY_BADGE_MAP,
} from '../constants';
import { apiClient } from '@/lib/api';

interface TaskDetailModalProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: (task: Task) => void;
    onRefresh: () => void;
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

export function TaskDetailModal({ task, open, onOpenChange, onEdit, onRefresh }: TaskDetailModalProps) {
    if (!task) return null;

    const priority   = PRIORITY_MAP[task.priority] ?? PRIORITY_MAP['MEDIUM'];
    const typeName   = TASK_TYPE_MAP[task.taskType] ?? task.taskType;
    const assignees  = parseJsonArray(task.assignees);
    const attachments = parseJsonArray(task.attachments);
    const mentions   = parseJsonArray(task.mentions);
    const images     = parseJsonArray(task.images);

    const handleStatusChange = async (newStatus: string) => {
        await apiClient(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
        });
        onRefresh();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-6">
                        <DialogTitle className="text-lg">
                            {typeName} #{task.number}
                        </DialogTitle>
                        <Button
                            size="sm"
                            onClick={() => onEdit(task)}
                            className="gap-1.5"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </Button>
                    </div>
                    <DialogDescription className="sr-only">
                        Details for task: {task.title}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={(PRIORITY_BADGE_MAP[task.priority] ?? 'info') as any}>
                            {priority.label}
                        </Badge>
                        <Badge variant="default">{typeName}</Badge>
                        <Badge variant={(STATUS_BADGE_MAP[task.status] ?? 'pending') as any}>
                            {STATUS_MAP[task.status]?.label ?? task.status}
                        </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold">{task.title}</h3>

                    {/* Status dropdown */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-medium">Status:</span>
                        <Select value={task.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-40 h-8 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TASK_STATUSES.map(s => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Description */}
                    {task.question && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                            <p className="text-sm whitespace-pre-wrap">{task.question}</p>
                        </div>
                    )}

                    {/* Proposed Solution */}
                    {task.proposedSolution && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Proposed Solution</p>
                            <p className="text-sm whitespace-pre-wrap">{task.proposedSolution}</p>
                        </div>
                    )}

                    {/* Assignees */}
                    {assignees.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />Assignees
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {assignees.map((a: any, i: number) => (
                                    <div key={a.id ?? i} className="flex items-center gap-1.5 bg-muted rounded-full pl-1 pr-2.5 py-0.5">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center">
                                            {initials(a.name)}
                                        </span>
                                        <span className="text-xs">{a.name ?? 'Unknown'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    {(task.startDate || task.endDate) && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />Dates
                            </p>
                            <p className="text-sm">
                                {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'}
                                {' → '}
                                {task.endDate ? new Date(task.endDate).toLocaleDateString() : '—'}
                            </p>
                        </div>
                    )}

                    {/* Mentions */}
                    {mentions.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                <AtSign className="h-3.5 w-3.5" />Mentions
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {mentions.map((m: any, i: number) => (
                                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border text-xs">
                                        <span className="text-muted-foreground capitalize text-[10px]">{m.type}</span>
                                        {m.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                <Paperclip className="h-3.5 w-3.5" />Attachments
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((f: any, i: number) => (
                                    <a
                                        key={i}
                                        href={f.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs border rounded-md px-2.5 py-1.5 bg-muted/30 hover:bg-muted transition-colors"
                                    >
                                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                                        <span className="truncate max-w-[150px]">{f.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Images */}
                    {images.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Images</p>
                            <div className="grid grid-cols-3 gap-2">
                                {images.map((img: any, i: number) => (
                                    <a
                                        key={i}
                                        href={img.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-primary/30 transition-all"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img.url} alt="Task image" className="object-cover w-full h-full" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Created by {task.createdBy.name ?? task.createdBy.email}</span>
                        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
