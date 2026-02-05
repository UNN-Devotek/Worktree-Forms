'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardMetrics } from '@/services/dashboard.service';
import { cn } from '@/lib/utils';

interface MetricsGridProps {
    metrics: DashboardMetrics;
    projectId: string;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeFilter = searchParams.get('filter');

    const handleFilter = (filterKey: string) => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (activeFilter === filterKey) {
            newParams.delete('filter'); // Toggle off
        } else {
            newParams.set('filter', filterKey);
        }
        router.push(`?${newParams.toString()}`);
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Total Submissions Card */}
            <Card 
                className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    activeFilter === 'total' && "ring-2 ring-primary"
                )}
                onClick={() => handleFilter('total')}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Submissions
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalSubmissions}</div>
                    <p className="text-xs text-muted-foreground">
                        All time
                    </p>
                </CardContent>
            </Card>

            {/* Dynamic cards based on Form Types present */}
            {metrics.statsByForm.map((stat, idx) => (
                <Card 
                    key={idx}
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        activeFilter === `form_${stat.formName}` && "ring-2 ring-primary"
                    )}
                    onClick={() => handleFilter(`form_${stat.formName}`)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium truncate" title={stat.formName}>
                            {stat.formName}
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.count}</div>
                        <p className="text-xs text-muted-foreground">
                            Version {stat.version}
                        </p>
                    </CardContent>
                </Card>
            ))}

            {/* Placeholder Aggregates (Simulated for Story 5.1 Requirement 2) */}
            <Card className="opacity-70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">--%</div>
                    <p className="text-xs text-muted-foreground">Not calculated yet</p>
                </CardContent>
            </Card>

             <Card className="opacity-70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Issues</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">No open issues</p>
                </CardContent>
            </Card>
        </div>
    );
}
