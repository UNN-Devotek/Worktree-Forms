'use client';

import { useEffect, useState } from 'react';
import { ProjectDashboardLayout } from './ProjectDashboardLayout';
import { MetricsGrid } from './MetricsGrid';
import { ActivityTable } from '@/features/projects/components/SubmissionGrid';
import { DashboardService, DashboardMetrics } from '@/services/dashboard.service';
import { Loader2 } from 'lucide-react';

interface DashboardViewProps {
    projectId: string;
    projectSlug: string;
    projectName: string;
}

export function DashboardView({ projectId }: DashboardViewProps) {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadData() {
            setLoading(true);
            try {
                const m = await DashboardService.getProjectMetrics(projectId);

                if (mounted) {
                    setMetrics(m);
                }
            } catch (err) {
                console.error('Dashboard Load Error', err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadData();

        return () => {
            mounted = false;
        };
    }, [projectId]);

    return (
        <ProjectDashboardLayout projectId={projectId}>
            {loading ? (
                <div className="w-full h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-6">
                    {metrics && <MetricsGrid metrics={metrics} projectId={projectId} />}
                    <ActivityTable projectId={projectId} />
                </div>
            )}
        </ProjectDashboardLayout>
    );
}
