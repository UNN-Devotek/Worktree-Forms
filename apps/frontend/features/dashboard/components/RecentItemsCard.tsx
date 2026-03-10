'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, FileText, LayoutList, Table2, Map, CheckSquare, FolderKanban } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';
import Link from 'next/link';

interface RecentItem {
    itemId: string;
    itemType: string;
    itemName: string;
    projectId: string;
    projectSlug: string;
    accessedAt: string;
}

interface RecentItemsCardProps {
    items: RecentItem[];
    isLoading: boolean;
    isFavorited: (itemId: string) => boolean;
    onToggleFavorite: (item: RecentItem) => void;
}

const typeIcons: Record<string, typeof FileText> = {
    PROJECT: FolderKanban,
    FORM: LayoutList,
    SHEET: Table2,
    ROUTE: Map,
    TASK: CheckSquare,
};

function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function RecentItemsCard({ items, isLoading, isFavorited, onToggleFavorite }: RecentItemsCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Recently Opened</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No recently accessed items. Start by opening a project.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">Project</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                                <TableHead className="w-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => {
                                const Icon = typeIcons[item.itemType] ?? FileText;
                                return (
                                    <TableRow key={`${item.itemType}-${item.itemId}`}>
                                        <TableCell><Icon className="h-4 w-4 text-muted-foreground" /></TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/project/${item.projectSlug}`}
                                                className="hover:underline font-medium"
                                            >
                                                {item.itemName}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">
                                            {item.projectSlug}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {formatTimeAgo(item.accessedAt)}
                                        </TableCell>
                                        <TableCell>
                                            <FavoriteButton
                                                isFavorited={isFavorited(item.itemId)}
                                                onToggle={() => onToggleFavorite(item)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
