'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, LayoutList, Users, CheckSquare, Map, Table2 } from 'lucide-react';
import { DashboardMetrics } from '@/services/dashboard.service';

interface MetricsGridProps {
    metrics: DashboardMetrics;
    projectId: string;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
    const cards = [
        {
            title: 'Submissions',
            icon: FileText,
            value: metrics.totalSubmissions,
            subtext: `+${metrics.thisWeekSubmissions} this week`,
        },
        {
            title: 'Active Forms',
            icon: LayoutList,
            value: metrics.activeForms,
            subtext: `of ${metrics.formCount} total`,
        },
        {
            title: 'Team Members',
            icon: Users,
            value: metrics.memberCount,
            subtext: 'on this project',
        },
        {
            title: 'Open Tasks',
            icon: CheckSquare,
            value: metrics.openTaskCount,
            subtext: `of ${metrics.taskCount} total`,
        },
        {
            title: 'Routes',
            icon: Map,
            value: metrics.routeCount,
            subtext: 'configured',
        },
        {
            title: 'Sheets',
            icon: Table2,
            value: metrics.sheetCount,
            subtext: 'data sheets',
        },
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
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{subtext}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
