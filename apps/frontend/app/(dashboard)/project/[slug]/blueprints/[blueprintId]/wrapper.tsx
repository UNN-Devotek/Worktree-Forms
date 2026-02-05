
'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlueprintViewer } from '@/features/blueprints/components/BlueprintViewer';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface BlueprintViewerClientWrapperProps {
    projectId: string;
    projectSlug: string;
    blueprintId: string;
}

export const BlueprintViewerClientWrapper: React.FC<BlueprintViewerClientWrapperProps> = ({ projectId, projectSlug, blueprintId }) => {
    const [title, setTitle] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSpec = async () => {
             // Fetch all specs (type=BLUEPRINT or SPEC) to find this one.
             // Ideally we'd have GET /api/specs/:id but this works for MVP.
             try {
                // Try searching with empty query to get all? Or specific ID search?
                // The search endpoint returns everything if q is empty.
                const res = await apiClient<{ data: any[] }>(`/api/projects/${projectId}/specs?type=BLUEPRINT`);
                const found = res.data?.find((s: any) => s.id === blueprintId);
                
                if (found) {
                    setTitle(found.title);
                    setFileUrl(found.fileUrl);
                } else {
                    // Fallback: Check SPEC type too?
                     const res2 = await apiClient<{ data: any[] }>(`/api/projects/${projectId}/specs?type=SPEC`);
                     const found2 = res2.data?.find((s: any) => s.id === blueprintId);
                     if (found2) {
                        setTitle(found2.title);
                        setFileUrl(found2.fileUrl);
                     } else {
                         // Not found
                         alert('Blueprint not found');
                         router.push(`/project/${projectSlug}/blueprints`);
                     }
                }
             } catch (e) {
                 console.error(e);
             } finally {
                 setLoading(false);
             }
        };

        fetchSpec();
    }, [projectId, blueprintId, projectSlug]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!fileUrl) return null;

    return (
        <BlueprintViewer 
            title={title} 
            fileUrl={fileUrl} 
            onBack={() => router.push(`/project/${projectSlug}/blueprints`)} 
        />
    );
};
