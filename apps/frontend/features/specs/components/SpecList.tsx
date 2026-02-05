'use client'; // Client component

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpecUploadModal } from './SpecUploadModal';
import { apiClient } from '@/lib/api';
import { Loader2, Search, FileText, Trash2 } from 'lucide-react';

interface Specification {
    id: string;
    section: string;
    title: string;
    keywords?: string;
    fileUrl: string;
    uploadedBy: { name: string };
    updatedAt: string;
}

interface SpecListProps {
    projectId: string;
}

export const SpecList: React.FC<SpecListProps> = ({ projectId }) => {
    const [specs, setSpecs] = useState<Specification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const fetchSpecs = async (query = '') => {
        setIsLoading(true);
        try {
            const url = query 
                ? `/api/projects/${projectId}/specs?q=${encodeURIComponent(query)}` 
                : `/api/projects/${projectId}/specs`;
            
            const res = await apiClient<{ success: boolean; data: Specification[] }>(url);
            if (res.success && res.data) {
                setSpecs(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSpecs(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [projectId, searchQuery]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this spec?')) return;
        
        try {
            await apiClient(`/api/specs/${id}`, { method: 'DELETE' });
            fetchSpecs(searchQuery);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input 
                        placeholder="Search specs by section, title or keyword..." 
                        className="pl-9"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsUploadOpen(true)}>Upload Spec</Button>
            </div>

            <div className="flex-1 border rounded-md overflow-hidden bg-white dark:bg-zinc-950">
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="overflow-y-auto max-h-full">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="p-3 font-medium w-32">Section</th>
                                    <th className="p-3 font-medium">Title</th>
                                    <th className="p-3 font-medium">Keywords</th>
                                    <th className="p-3 font-medium">Uploaded By</th>
                                    <th className="p-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {specs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No specifications found.
                                        </td>
                                    </tr>
                                )}
                                {specs.map(spec => (
                                    <tr 
                                        key={spec.id} 
                                        className="border-t hover:bg-muted/50 group cursor-pointer"
                                        onClick={() => window.open(spec.fileUrl, '_blank')}
                                    >
                                        <td className="p-3 font-mono text-zinc-600 dark:text-zinc-400">{spec.section}</td>
                                        <td className="p-3 font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-red-500" />
                                            {spec.title}
                                        </td>
                                        <td className="p-3 text-muted-foreground">{spec.keywords || '-'}</td>
                                        <td className="p-3 text-muted-foreground">{spec.uploadedBy?.name}</td>
                                        <td className="p-3 text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleDelete(e, spec.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <SpecUploadModal 
                projectId={projectId} 
                isOpen={isUploadOpen} 
                onClose={() => setIsUploadOpen(false)}
                onSuccess={() => {
                    setIsUploadOpen(false);
                    fetchSpecs(searchQuery);
                }} 
            />
        </div>
    );
};
