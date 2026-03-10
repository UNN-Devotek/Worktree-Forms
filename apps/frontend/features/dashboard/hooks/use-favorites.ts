'use client';

import { useState, useCallback } from 'react';
import { DashboardService, FavoriteItem } from '@/services/dashboard.service';

export function useFavorites(initialFavorites: FavoriteItem[]) {
    const [favorites, setFavorites] = useState<FavoriteItem[]>(initialFavorites);

    const isFavorited = useCallback((itemId: string) => {
        return favorites.some((f) => f.itemId === itemId);
    }, [favorites]);

    const toggleFavorite = useCallback(async (item: {
        itemId: string;
        itemType: string;
        itemName: string;
        projectId: string;
        projectSlug: string;
    }) => {
        const existing = favorites.find((f) => f.itemId === item.itemId);
        if (existing) {
            // Optimistic remove
            setFavorites((prev) => prev.filter((f) => f.itemId !== item.itemId));
            try {
                await DashboardService.removeFavorite(item.itemType, item.itemId);
            } catch {
                // Rollback on error
                setFavorites((prev) => [...prev, existing]);
            }
        } else {
            // Optimistic add
            const newFav: FavoriteItem = { ...item, createdAt: new Date().toISOString() };
            setFavorites((prev) => [...prev, newFav]);
            try {
                await DashboardService.addFavorite(item);
            } catch {
                // Rollback on error
                setFavorites((prev) => prev.filter((f) => f.itemId !== item.itemId));
            }
        }
    }, [favorites]);

    return { favorites, isFavorited, toggleFavorite, setFavorites };
}
