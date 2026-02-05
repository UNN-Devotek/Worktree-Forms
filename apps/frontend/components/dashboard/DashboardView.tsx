'use client';

import { useEffect, useState } from 'react';
import { ProjectDashboardLayout } from './ProjectDashboardLayout';
import { MetricsGrid } from './MetricsGrid';
import { ActivityFeed } from './ActivityFeed';
import { SubmissionGrid } from '@/features/projects/components/SubmissionGrid';
import { ProjectUsageCard } from '@/features/projects/components/ProjectUsageCard';
import { DashboardService, DashboardMetrics, ActivityItem } from '@/services/dashboard.service';
import { Loader2 } from 'lucide-react';

interface DashboardViewProps {
    projectId: string;
    projectSlug: string;
    projectName: string;
}

export function DashboardView({ projectId }: DashboardViewProps) {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadData() {
            setLoading(true);
            try {
                const [m, a] = await Promise.all([
                    DashboardService.getProjectMetrics(projectId),
                    DashboardService.getActivityFeed(projectId)
                ]);
                
                if (mounted) {
                    setMetrics(m);
                    setActivity(a);
                }
            } catch (err) {
                console.error("Dashboard Load Error", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadData();

        return () => { mounted = false; };
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
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                         <div className="col-span-4 lg:col-span-5">
                             {/* Main Submission Grid */}
                             <SubmissionGrid projectId={projectId} />
                         </div>
                         <div className="col-span-3 lg:col-span-2 space-y-6">
                             {metrics && (
                                <ProjectUsageCard 
                                    plan={metrics.plan} 
                                    storageUsage={metrics.storageUsage} 
                                    submissionCount={metrics.submissionCount} 
                                />
                             )}
                             <ActivityFeed activities={activity} />
                         </div>
                    </div>
                </div>
            )}
        </ProjectDashboardLayout>
    );
}
