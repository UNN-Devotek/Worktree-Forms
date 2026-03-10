'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, FileText, LayoutList, Table2, Map, CheckSquare, FolderKanban } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';
import Link from 'next/link';

interface FavoriteItem {
    itemId: string;
    itemType: string;
    itemName: string;
    projectId: string;
    projectSlug: string;
    createdAt: string;
}

interface FavoritesCardProps {
    items: FavoriteItem[];
    isLoading: boolean;
    onRemoveFavorite: (item: FavoriteItem) => void;
}

const typeIcons: Record<string, typeof FileText> = {
    PROJECT: FolderKanban,
    FORM: LayoutList,
    SHEET: Table2,
    ROUTE: Map,
    TASK: CheckSquare,
};

export function FavoritesCard({ items, isLoading, onRemoveFavorite }: FavoritesCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Star className="h-4 w-4 text-yellow-500" />
                <CardTitle className="text-base">Favorites</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        Star items for quick access
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">Project</TableHead>
                                <TableHead className="hidden md:table-cell text-right">Added</TableHead>
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
                                        <TableCell className="hidden md:table-cell text-right text-muted-foreground text-sm">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <FavoriteButton
                                                isFavorited={true}
                                                onToggle={() => onRemoveFavorite(item)}
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
