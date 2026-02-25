'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { apiClient } from '@/lib/api';
import { Loader2, Paperclip, X, AtSign, Search, Check, ChevronsUpDown, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_TYPES, TASK_STATUSES, PRIORITY_LEVELS } from '../constants';
import { ProjectMember, TaskMention, TaskAttachment, Task } from '../types';

interface CreateTaskModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editTask?: Task | null;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ projectId, isOpen, onClose, onSuccess, editTask }) => {
    const isEditing = !!editTask;

    // Core fields
    const [title,    setTitle]    = useState('');
    const [question, setQuestion] = useState('');
    const [taskType, setTaskType] = useState('GENERAL');
    const [status,   setStatus]   = useState('ACTIVE');
    const [priority, setPriority] = useState('MEDIUM');

    // Dates
    const [startDate, setStartDate] = useState('');
    const [endDate,   setEndDate]   = useState('');

    // Assignees
    const [members,       setMembers]       = useState<ProjectMember[]>([]);
    const [assignees,     setAssignees]     = useState<{ id: string; name: string | null }[]>([]);
    const [assigneeOpen,  setAssigneeOpen]  = useState(false);
    const [assigneeQuery, setAssigneeQuery] = useState('');

    // Combined uploads (files + images)
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [images,      setImages]      = useState<{ url: string; objectKey: string; name: string }[]>([]);
    const [isDragging,  setIsDragging]  = useState(false);
    const [uploading,   setUploading]   = useState(false);
    const uploadRef = useRef<HTMLInputElement>(null);

    // Mentions
    const [mentions,       setMentions]       = useState<TaskMention[]>([]);
    const [mentionQuery,   setMentionQuery]   = useState('');
    const [mentionResults, setMentionResults] = useState<TaskMention[]>([]);
    const [mentionLoading, setMentionLoading] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (!isOpen || !editTask) return;
        setTitle(editTask.title);
        setQuestion(editTask.question ?? '');
        setTaskType(editTask.taskType ?? 'GENERAL');
        setStatus(editTask.status ?? 'ACTIVE');
        setPriority(editTask.priority ?? 'MEDIUM');
        setStartDate(editTask.startDate ? editTask.startDate.slice(0, 10) : '');
        setEndDate(editTask.endDate ? editTask.endDate.slice(0, 10) : '');
        // Parse JSON arrays safely
        const parseArr = (v: unknown): any[] => {
            if (Array.isArray(v)) return v;
            if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
            return [];
        };
        setAssignees(parseArr(editTask.assignees).map((a: any) => ({ id: a.id, name: a.name })));
        setAttachments(parseArr(editTask.attachments));
        setMentions(parseArr(editTask.mentions));
        setImages(parseArr(editTask.images).map((img: any) => ({ url: img.url, objectKey: img.objectKey, name: img.objectKey ?? 'Image' })));
    }, [isOpen, editTask]);

    // Fetch project members on open
    useEffect(() => {
        if (!isOpen) return;
        apiClient<{ success: boolean; data: ProjectMember[] }>(`/api/projects/${projectId}/members`)
            .then(r => { if (r.success) setMembers(r.data); })
            .catch(() => {});
    }, [isOpen, projectId]);

    // Mention search
    useEffect(() => {
        if (mentionQuery.length < 1) { setMentionResults([]); return; }
        const q = mentionQuery.toLowerCase();
        setMentionLoading(true);

        Promise.all([
            apiClient<{ success: boolean; data: any[] }>(`/api/projects/${projectId}/sheets-list`).catch(() => ({ success: false, data: [] })),
            apiClient<{ success: boolean; data: any[] }>(`/api/projects/${projectId}/specs?q=${encodeURIComponent(mentionQuery)}`).catch(() => ({ success: false, data: [] })),
        ]).then(([sheetsRes, specsRes]) => {
            const results: TaskMention[] = [];
            if (sheetsRes.success) {
                (sheetsRes.data as any[])
                    .filter((s: any) => s.title?.toLowerCase().includes(q))
                    .forEach((s: any) => results.push({ type: 'sheet', id: s.id, label: s.title }));
            }
            if (specsRes.success) {
                (specsRes.data as any[])
                    .forEach((s: any) => results.push({ type: 'spec', id: s.id, label: `${s.section} ${s.title}` }));
            }
            setMentionResults(results.slice(0, 8));
        }).finally(() => setMentionLoading(false));
    }, [mentionQuery, projectId]);

    const toggleAssignee = (member: ProjectMember) => {
        setAssignees(prev =>
            prev.find(a => a.id === member.id)
                ? prev.filter(a => a.id !== member.id)
                : [...prev, { id: member.id, name: member.name }]
        );
    };

    const addMention = (item: TaskMention) => {
        if (!mentions.find(m => m.id === item.id && m.type === item.type)) {
            setMentions(prev => [...prev, item]);
        }
        setMentionQuery('');
        setMentionResults([]);
    };

    const uploadFile = useCallback(async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await apiClient<{ success: boolean; data: { url: string; objectKey: string } }>(
                `/api/projects/${projectId}/upload`,
                { method: 'POST', body: formData, isFormData: true }
            );
            if (res.success && res.data) {
                if (file.type.startsWith('image/')) {
                    setImages(prev => [...prev, { url: res.data.url, objectKey: res.data.objectKey, name: file.name }]);
                } else {
                    setAttachments(prev => [...prev, {
                        url: res.data.url,
                        objectKey: res.data.objectKey,
                        name: file.name,
                        type: file.type,
                    }]);
                }
            }
        } catch (e) { console.error(e); }
        finally { setUploading(false); }
    }, [projectId]);

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files) return;
        Array.from(files).forEach(f => uploadFile(f));
    }, [uploadFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = {
            title, question, taskType, status, priority,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            assignees, attachments, mentions,
            images: images.map(({ url, objectKey }) => ({ url, objectKey })),
        };
        try {
            const url = isEditing
                ? `/api/tasks/${editTask!.id}`
                : `/api/projects/${projectId}/tasks`;
            const res = await apiClient(url, {
                method: isEditing ? 'PATCH' : 'POST',
                body: JSON.stringify(payload),
            });
            if (res.success) {
                onSuccess();
                resetForm();
            }
        } catch (e) { console.error(e); }
        finally { setIsSubmitting(false); }
    };

    const resetForm = () => {
        setTitle(''); setQuestion(''); setTaskType('GENERAL'); setStatus('ACTIVE');
        setPriority('MEDIUM'); setStartDate(''); setEndDate('');
        setAssignees([]); setAttachments([]); setImages([]); setMentions([]);
        setMentionQuery(''); setAssigneeQuery('');
    };

    if (!isOpen) return null;

    const filteredMembers = members.filter(m =>
        (m.name ?? m.email).toLowerCase().includes(assigneeQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-base font-semibold">{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
                    <button onClick={() => { onClose(); resetForm(); }} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                    <div className="px-6 py-4 space-y-5">

                        {/* Row: Type + Priority + Status */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">Task Type</label>
                                <Select value={taskType} onValueChange={setTaskType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TASK_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">Priority</label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRIORITY_LEVELS.map(p => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">Status</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TASK_STATUSES.map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">Title <span className="text-destructive">*</span></label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief summary" required />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">Description / Question</label>
                            <Textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Describe the task in detail..." className="min-h-[90px]" />
                        </div>

                        {/* Assignees — searchable combobox */}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">Assignees</label>
                            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex w-full min-h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <div className="flex flex-1 flex-wrap gap-1">
                                            {assignees.length === 0 ? (
                                                <span className="text-muted-foreground">Select assignees…</span>
                                            ) : (
                                                assignees.map(a => (
                                                    <span
                                                        key={a.id}
                                                        className="flex items-center gap-1 bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5"
                                                    >
                                                        {a.name}
                                                        <span
                                                            role="button"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setAssignees(prev => prev.filter(x => x.id !== a.id));
                                                            }}
                                                            className="cursor-pointer hover:text-destructive"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </span>
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search members..."
                                            value={assigneeQuery}
                                            onValueChange={setAssigneeQuery}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No members found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredMembers.map(m => {
                                                    const isSelected = assignees.some(a => a.id === m.id);
                                                    return (
                                                        <CommandItem
                                                            key={m.id}
                                                            value={m.name ?? m.email}
                                                            onSelect={() => toggleAssignee(m)}
                                                        >
                                                            <Check className={cn('mr-2 h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                                                            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                {(m.name ?? m.email)[0].toUpperCase()}
                                                            </span>
                                                            <span className="ml-2">{m.name ?? m.email}</span>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">Start Date</label>
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">End Date</label>
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>

                        {/* Mentions */}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                <AtSign className="inline h-3 w-3 mr-0.5" />Mentions (sheets, specs)
                            </label>
                            {mentions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {mentions.map((m, i) => (
                                        <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border text-xs">
                                            <span className="text-muted-foreground capitalize">{m.type}</span>: {m.label}
                                            <button type="button" onClick={() => setMentions(prev => prev.filter((_, j) => j !== i))}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={mentionQuery}
                                    onChange={e => setMentionQuery(e.target.value)}
                                    placeholder="Search sheets or specs..."
                                    className="pl-8 text-sm"
                                />
                                {(mentionResults.length > 0 || mentionLoading) && (
                                    <div className="absolute z-10 top-full mt-1 w-full bg-popover border rounded-md shadow-lg overflow-hidden">
                                        {mentionLoading && <div className="p-2 text-xs text-muted-foreground">Searching…</div>}
                                        {mentionResults.map((item, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => addMention(item)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                                            >
                                                <span className="text-[10px] uppercase font-medium text-muted-foreground border rounded px-1">{item.type}</span>
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Combined upload area */}
                        <div>
                            <label className="block text-xs font-medium mb-2 text-muted-foreground">
                                <Paperclip className="inline h-3 w-3 mr-0.5" />Attachments &amp; Photos
                            </label>

                            {/* Existing uploads preview */}
                            {(attachments.length > 0 || images.length > 0) && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {images.map((img, i) => (
                                        <div key={`img-${i}`} className="relative w-14 h-14 rounded-md overflow-hidden border flex-shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img.url} alt={img.name} className="object-cover w-full h-full" />
                                            <button
                                                type="button"
                                                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                                                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-destructive transition-colors"
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {attachments.map((f, i) => (
                                        <div key={`file-${i}`} className="flex items-center gap-2 text-xs border rounded-md px-2 py-1 bg-muted/30 max-w-[180px]">
                                            <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                            <span className="truncate flex-1">{f.name}</span>
                                            <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}>
                                                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Drop zone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => uploadRef.current?.click()}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-5 cursor-pointer transition-colors',
                                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                                )}
                            >
                                {uploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Upload className="h-4 w-4" />
                                            <ImageIcon className="h-4 w-4" />
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Drop files or photos here, or <span className="text-primary font-medium">browse</span>
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/60">Images, PDFs, and any file type</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={uploadRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={e => { handleFiles(e.target.files); if (uploadRef.current) uploadRef.current.value = ''; }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/20">
                        <Button type="button" variant="neutral" className="bg-transparent border-0 shadow-none hover:bg-accent text-muted-foreground" onClick={() => { onClose(); resetForm(); }}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || uploading}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Update Task' : 'Create Task'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
