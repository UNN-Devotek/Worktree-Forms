'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlueprintUploadModal } from './BlueprintUploadModal';
import { apiClient } from '@/lib/api';
import { Loader2, Search, FileText, Trash2, Map, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Specification {
    id: string;
    section: string;
    title: string;
    keywords?: string;
    fileUrl: string;
    uploadedBy: { name: string };
    updatedAt: string;
}

interface BlueprintListProps {
    projectId: string;
    projectSlug: string;
}

export const BlueprintList: React.FC<BlueprintListProps> = ({ projectId, projectSlug }) => {
    const [blueprints, setBlueprints] = useState<Specification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const router = useRouter();

    const fetchBlueprints = async (query = '') => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ 
                q: query,
                type: 'BLUEPRINT' 
            });
            
            const res = await apiClient<{ success: boolean; data: Specification[] }>(
                `/api/projects/${projectId}/specs?${params.toString()}`
            );
            if (res.success && res.data) {
                setBlueprints(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBlueprints(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [projectId, searchQuery]); // Correct dependency

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this blueprint?')) return;
        
        try {
            await apiClient(`/api/specs/${id}`, { method: 'DELETE' });
            fetchBlueprints(searchQuery);
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
                        placeholder="Search blueprints..." 
                        className="pl-9"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsUploadOpen(true)}>Upload Blueprint</Button>
            </div>

            <div className="flex-1 mt-4">
                 {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-full pb-4">
                        {blueprints.length === 0 && (
                            <div className="col-span-full text-center text-muted-foreground p-8">
                                No blueprints found.
                            </div>
                        )}
                        {blueprints.map(bp => (
                            <div 
                                key={bp.id} 
                                className="group relative aspect-[3/4] bg-white dark:bg-zinc-900 border rounded-lg hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col"
                                onClick={() => router.push(`/project/${projectSlug}/blueprints/${bp.id}`)}
                            >
                                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <Map className="h-12 w-12 text-zinc-300" />
                                </div>
                                <div className="p-3 border-t">
                                    <p className="text-xs font-mono text-zinc-500 truncate">{bp.section}</p>
                                    <h3 className="font-semibold text-sm truncate" title={bp.title}>{bp.title}</h3>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        {new Date(bp.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => handleDelete(e, bp.id)}
                                    className="absolute top-2 right-2 bg-white/80 dark:bg-black/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BlueprintUploadModal 
                projectId={projectId} 
                isOpen={isUploadOpen} 
                onClose={() => setIsUploadOpen(false)}
                onSuccess={() => {
                    setIsUploadOpen(false);
                    fetchBlueprints(searchQuery);
                }} 
            />
        </div>
    );
};
