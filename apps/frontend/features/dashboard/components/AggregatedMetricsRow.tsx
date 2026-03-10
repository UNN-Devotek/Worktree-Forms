'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, LayoutList, FileText, CheckSquare, Table2, Map } from 'lucide-react';
import type { AggregatedMetrics } from '@/services/dashboard.service';

interface AggregatedMetricsRowProps {
    metrics: AggregatedMetrics;
    isLoading: boolean;
}

export function AggregatedMetricsRow({ metrics, isLoading }: AggregatedMetricsRowProps) {
    const cards = [
        { title: 'Projects', icon: FolderKanban, value: metrics.totalProjects, subtext: 'total projects' },
        { title: 'Active Forms', icon: LayoutList, value: metrics.activeForms, subtext: `of ${metrics.totalForms} total` },
        { title: 'Submissions', icon: FileText, value: metrics.totalSubmissions, subtext: `+${metrics.thisWeekSubmissions} this week` },
        { title: 'Open Tasks', icon: CheckSquare, value: metrics.openTasks, subtext: `of ${metrics.totalTasks} total` },
        { title: 'Sheets', icon: Table2, value: metrics.totalSheets, subtext: 'data sheets' },
        { title: 'Routes', icon: Map, value: metrics.totalRoutes, subtext: 'configured' },
    ];

    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {cards.map(({ title, icon: Icon, value, subtext }) => (
                <Card key={title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{title}</CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{value}</div>
                                <p className="text-xs text-muted-foreground">{subtext}</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
