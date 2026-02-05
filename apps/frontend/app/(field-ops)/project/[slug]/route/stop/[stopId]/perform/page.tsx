'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, WifiOff } from 'lucide-react';
import { FormRenderer } from '@/components/form-renderer/FormRenderer';
import { apiClient } from '@/lib/api';
import { useGeolocation } from '@/hooks/use-geolocation';
// import { useOfflineQueue } from '@/features/offline/hooks/use-offline-queue'; // We'll implement this hook logic inline or assuming it exists.

interface PerformPageProps {
    params: {
        slug: string;
        stopId: string;
    }
}

export default function PerformPage({ params }: PerformPageProps) {
    const router = useRouter();
    const { stopId, slug } = params;
    const queryClient = useQueryClient();
    const { coordinates } = useGeolocation();

    const [isOffline, setIsOffline] = useState(false);

    // Network Status
    useEffect(() => {
        setIsOffline(!navigator.onLine);
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 1. Fetch Stop & Form Schema
    // Note: We might need to cache this for true offline support (Service Worker or LocalStorage wrapper).
    // For "Offline First", we assume React Query persistence is active or we rely on the PWA cache.
    const { data: routeStop, isLoading } = useQuery({
        queryKey: ['stop', stopId],
        queryFn: async () => {
            const res = await fetch(`/api/routes/stops/${stopId}`);
            if (!res.ok) throw new Error('Failed to load stop');
            const json = await res.json();
            return json.data.stop;
        }
    });

    // 2. Form Schema
    // Ideally the stop query includes the full form schema or we fetch it separately.
    // Fetching separately allows individual caching.
    const formId = routeStop?.form?.id;
    const { data: form, isLoading: isFormLoading } = useQuery({
        queryKey: ['form', formId],
        queryFn: async () => {
             const res = await fetch(`/api/forms/${formId}`);
             if (!res.ok) throw new Error('Failed to load form');
             const json = await res.json();
             return json.data;
        },
        enabled: !!formId
    });

    /*
    // 3. Submission Logic
    // If offline -> queue. If online -> submit.
    const submitMutation = useMutation({
        mutationFn: async (formData: any) => {
            if (isOffline) {
                // Throw specific error or handle here?
                // Let's handle generic offline logic via queueing "Service" or Context.
                // For MVP, we'll mimic queueing by throwing an 'offline' error that the UI catches.
                throw new Error('OFFLINE_QUEUE_NEEDED'); 
            }

            const payload = {
                data: formData,
                stopId: Number(stopId),
                location: coordinates,
                submittedAt: new Date().toISOString()
            };

            const res = await apiClient(`/api/forms/${formId}/submissions`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return res;
        },
        onSuccess: async () => {
             // Mark stop complete
             await fetch(`/api/routes/stops/${stopId}/status`, {
                 method: 'PATCH',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ status: 'completed' })
             });
             queryClient.invalidateQueries({ queryKey: ['stop', stopId] });
             queryClient.invalidateQueries({ queryKey: ['daily-route'] });
             router.push(`/project/${slug}/routes/my-daily`); // Go back to list
        },
        onError: (err: any) => {
            if (err.message === 'OFFLINE_QUEUE_NEEDED' || !navigator.onLine) {
                 // Trigger Offline Queue Logic
                 // In a real implementation: offlineQueue.add({ type: 'submission', payload: ... })
                 queueOfflineSubmission({
                    formId,
                    stopId: Number(stopId),
                    data: (err as any).formData || {}, // We need to pass data through error or separate handler
                    location: coordinates
                 });
                 alert("Saved to Outbox (Offline). Will upload when online.");
                 router.push(`/project/${slug}/routes/my-daily`);
                 return;
            }
            console.error(err);
            alert("Submission failed. Please try again.");
        }
    });

    const handleSubmit = (data: any) => {
        if (isOffline) {
             queueOfflineSubmission({
                formId,
                stopId: Number(stopId),
                data,
                location: coordinates
             });
             alert("No Internet. Saved to Device. Will upload when you reconnect.");
             // Optimistically mark as completed locally?
             router.push(`/project/${slug}/routes/my-daily`);
        } else {
             submitMutation.mutate(data);
        }
    };

    // Mock Queue Helper
    const queueOfflineSubmission = (item: any) => {
        const queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
        queue.push({
            id: crypto.randomUUID(),
            type: 'submission',
            payload: item,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('offline-queue', JSON.stringify(queue));
        // Force a storage event or notify context if needed
        window.dispatchEvent(new Event('offline-queue-update'));
    };
    */

    if (isLoading || isFormLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!routeStop || !form) {
        return <div className="p-8 text-center">Form not found or stop invalid.</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 mr-2" /> Back
                </Button>
                <div className="text-sm font-semibold text-center">
                    {routeStop.title}
                    {isOffline && <span className="ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs flex items-center inline-flex"><WifiOff className="w-3 h-3 mr-1" /> Offline</span>}
                </div>
                <div className="w-16" /> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:max-w-2xl lg:mx-auto lg:w-full">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
                    <p className="text-muted-foreground">{form.description || 'Complete this form to finish the job.'}</p>
                </div>

                <FormRenderer 
                    formSchema={form.form_schema || { pages: [] }} 
                    formId={Number(formId)}
                    groupId={1} // TODO: dynamic group ID
                    onSuccess={async () => {
                         // Mark stop complete
                         await fetch(`/api/routes/stops/${stopId}/status`, {
                             method: 'PATCH',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ status: 'completed' })
                         });
                         queryClient.invalidateQueries({ queryKey: ['stop', stopId] });
                         queryClient.invalidateQueries({ queryKey: ['daily-route'] });
                         router.push(`/project/${slug}/routes/my-daily`);
                    }}
                    // isSubmitting and isOffline are handled internally or not supported by this component yet
                />
            </div>
        </div>
    );
}
