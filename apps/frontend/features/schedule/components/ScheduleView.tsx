"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Loader2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ScheduleTask {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string; // PLANNED, IN_PROGRESS, COMPLETED
    assignedTo?: { id: string; name: string };
}

interface ScheduleViewProps {
    projectId: string;
}

export const ScheduleView = ({ projectId }: ScheduleViewProps) => {
    const [tasks, setTasks] = useState<ScheduleTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // View Mode (Desktop Table vs Mobile List - handled via CSS/Tailwind responsively)
    // But we might want specific layout logic too.
    
    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient<{ success: boolean; data: ScheduleTask[] }>(`/api/projects/${projectId}/schedule`);
            if (res.success && res.data) {
                setTasks(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <Badge className="bg-green-500">Completed</Badge>;
            case 'IN_PROGRESS': return <Badge className="bg-blue-500">In Progress</Badge>;
            default: return <Badge variant="outline">Planned</Badge>;
        }
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                     <h1 className="text-2xl font-bold">Schedule</h1>
                     <p className="text-muted-foreground hidden md:block">Track project milestones and tasks.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                </Button>
            </div>

            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {/* Mobile: Cards */}
                        <div className="md:hidden space-y-3">
                            {tasks.map(task => (
                                <div key={task.id} className="bg-white dark:bg-zinc-900 border rounded-lg p-4 shadow-sm flex flex-col gap-2">
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <h3 className="font-semibold">{task.title}</h3>
                                             <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                 <CalendarIcon className="h-3 w-3" />
                                                 {format(new Date(task.startDate), 'MMM d')} - {format(new Date(task.endDate), 'MMM d, yyyy')}
                                             </p>
                                         </div>
                                         {getStatusBadge(task.status)}
                                     </div>
                                </div>
                            ))}
                             {tasks.length === 0 && <p className="text-center text-muted-foreground py-8">No upcoming tasks.</p>}
                        </div>

                        {/* Desktop: Table-like list */}
                        <div className="hidden md:block">
                             <div className="border rounded-lg overflow-hidden">
                                 <table className="w-full text-sm text-left">
                                     <thead className="bg-zinc-50 dark:bg-zinc-800 border-b">
                                         <tr>
                                             <th className="px-4 py-3 font-medium">Task</th>
                                             <th className="px-4 py-3 font-medium">Start Date</th>
                                             <th className="px-4 py-3 font-medium">End Date</th>
                                             <th className="px-4 py-3 font-medium">Status</th>
                                             <th className="px-4 py-3 font-medium text-right">Actions</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y">
                                         {tasks.map(task => (
                                             <tr key={task.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                 <td className="px-4 py-3 font-medium">{task.title}</td>
                                                 <td className="px-4 py-3 text-muted-foreground">{format(new Date(task.startDate), 'MMM d, yyyy')}</td>
                                                 <td className="px-4 py-3 text-muted-foreground">{format(new Date(task.endDate), 'MMM d, yyyy')}</td>
                                                 <td className="px-4 py-3">{getStatusBadge(task.status)}</td>
                                                 <td className="px-4 py-3 text-right">
                                                     {/* Actions like Edit/Delete could go here */}
                                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                          <span className="sr-only">Menu</span>
                                                          <div className="flex gap-1">
                                                              <div className="h-1 w-1 bg-zinc-500 rounded-full" />
                                                              <div className="h-1 w-1 bg-zinc-500 rounded-full" />
                                                              <div className="h-1 w-1 bg-zinc-500 rounded-full" />
                                                          </div>
                                                     </Button>
                                                 </td>
                                             </tr>
                                         ))}
                                         {tasks.length === 0 && (
                                             <tr>
                                                 <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                     No tasks scheduled.
                                                 </td>
                                             </tr>
                                         )}
                                     </tbody>
                                 </table>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            <CreateTaskModal 
                projectId={projectId} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={() => { setIsModalOpen(false); fetchTasks(); }} 
            />
        </div>
    );
};

// Simple Internal Modal Component
const CreateTaskModal = ({ projectId, isOpen, onClose, onSuccess }: any) => {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiClient(`/api/projects/${projectId}/schedule`, {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    startDate,
                    endDate,
                    status: 'PLANNED'
                })
            });
            onSuccess();
            setTitle(''); setStartDate(''); setEndDate('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Schedule Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Task Title</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Foundation Pour" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Start Date</label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-sm font-medium">End Date</label>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
