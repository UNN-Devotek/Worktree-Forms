'use client';

import { ActivityItem } from '@/services/dashboard.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
// Assuming date-fns might not be installed, use native Intl.RelativeTimeFormat or simple logic if safe.
// Or just standard date string.

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 pb-4">
                <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Latest submissions and updates.</p>
            </div>
            <div className="p-6 pt-0">
                <ScrollArea className="h-[400px] pr-4">
                    {activities.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            No recent activity.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activities.map((item) => (
                                <div key={item.id} className="flex items-start gap-4">
                                    <Avatar className="h-9 w-9 mt-0.5">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.user}`} />
                                        <AvatarFallback>{item.user.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            <span className="font-semibold">{item.user}</span> {item.action} <span className="font-semibold text-primary">{item.target}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatTimeAgo(item.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
