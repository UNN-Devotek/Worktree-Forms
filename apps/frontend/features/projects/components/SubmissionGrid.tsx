'use client';

import * as React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { DashboardService, ActivityItem } from '@/services/dashboard.service';
import { cn } from '@/lib/utils';

interface ActivityTableProps {
    projectId: string;
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityTable({ projectId }: ActivityTableProps) {
    const [data, setData] = React.useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        let mounted = true;

        async function loadData() {
            setIsLoading(true);
            try {
                const activities = await DashboardService.getActivityFeed(projectId);
                if (mounted) {
                    setData(activities);
                }
            } catch (e) {
                console.error('Failed to load activity data', e);
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        loadData();

        return () => {
            mounted = false;
        };
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No recent activity.
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Form</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Submitted by</TableHead>
                        <TableHead>Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TooltipProvider>
                        {data.map((item) => (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <TableRow
                                        className={cn('cursor-pointer')}
                                        onClick={() =>
                                            window.open(
                                                `/api/forms/submissions/${item.id}/zip`,
                                                '_blank',
                                            )
                                        }
                                    >
                                        <TableCell>{item.target}</TableCell>
                                        <TableCell>{item.action}</TableCell>
                                        <TableCell>{item.user}</TableCell>
                                        <TableCell>{formatTimeAgo(item.timestamp)}</TableCell>
                                    </TableRow>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Click to open submission</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </TableBody>
            </Table>
        </div>
    );
}
