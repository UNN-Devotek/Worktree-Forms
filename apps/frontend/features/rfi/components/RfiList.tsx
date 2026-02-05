'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreateRfiModal } from './CreateRfiModal';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Rfi {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    description?: string;
    createdBy: { name: string; id: string };
    assignedTo?: { name: string; id: string };
}

interface RfiListProps {
    projectId: string;
}

export const RfiList: React.FC<RfiListProps> = ({ projectId }) => {
    const [rfis, setRfis] = useState<Rfi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchRfis = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient<{ success: boolean; data: Rfi[] }>(`/api/projects/${projectId}/rfis`);
            if (res.success && res.data) {
                setRfis(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRfis();
    }, [projectId]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">RFIs</h2>
                <Button onClick={() => setIsCreateOpen(true)}>New RFI</Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="border rounded-md">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="p-3 font-medium">Title</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3 font-medium">Assigned To</th>
                                <th className="p-3 font-medium">Created By</th>
                                <th className="p-3 font-medium">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rfis.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        No RFIs found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                            {rfis.map(rfi => (
                                <tr key={rfi.id} className="border-t hover:bg-muted/50 cursor-pointer">
                                    <td className="p-3 font-medium">{rfi.title}</td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                            ${rfi.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 
                                              rfi.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {rfi.status}
                                        </span>
                                    </td>
                                    <td className="p-3">{rfi.assignedTo?.name || '-'}</td>
                                    <td className="p-3">{rfi.createdBy.name}</td>
                                    <td className="p-3">{new Date(rfi.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        {rfi.status === 'DRAFT' && (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await apiClient(`/api/rfis/${rfi.id}`, {
                                                        method: 'PATCH',
                                                        body: JSON.stringify({ status: 'OPEN' })
                                                    });
                                                    fetchRfis();
                                                }}
                                            >
                                                Publish
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CreateRfiModal 
                projectId={projectId} 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => {
                    setIsCreateOpen(false);
                    fetchRfis();
                }} 
            />
        </div>
    );
};
