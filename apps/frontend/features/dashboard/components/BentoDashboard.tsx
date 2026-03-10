'use client';

import { useEffect } from 'react';
import { useDashboardData } from '../hooks/use-dashboard-data';
import { useFavorites } from '../hooks/use-favorites';
import { AggregatedMetricsRow } from './AggregatedMetricsRow';
import { RecentItemsCard } from './RecentItemsCard';
import { FavoritesCard } from './FavoritesCard';
import { NewsCarousel } from './NewsCarousel';

interface BentoDashboardProps {
    userName: string;
}

export function BentoDashboard({ userName }: BentoDashboardProps) {
    const { metrics, recent, favorites: loadedFavorites, news, isLoading } = useDashboardData();
    const { favorites, isFavorited, toggleFavorite, setFavorites } = useFavorites([]);

    // Sync favorites when dashboard data finishes loading
    useEffect(() => {
        if (!isLoading && loadedFavorites.length > 0) {
            setFavorites(loadedFavorites);
        }
    }, [isLoading, loadedFavorites, setFavorites]);

    return (
        <div className="flex flex-col gap-6">
            {/* Welcome Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Welcome back, {userName}. Here&apos;s an overview of your workspace.
                </p>
            </div>

            {/* Aggregated Metrics Row */}
            <AggregatedMetricsRow metrics={metrics} isLoading={isLoading} />

            {/* Content Grid: Recent + News + Favorites */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6">
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <RecentItemsCard
                        items={recent}
                        isLoading={isLoading}
                        isFavorited={isFavorited}
                        onToggleFavorite={toggleFavorite}
                    />
                    <FavoritesCard
                        items={favorites}
                        isLoading={isLoading}
                        onRemoveFavorite={toggleFavorite}
                    />
                </div>
                <div className="lg:col-span-4">
                    <NewsCarousel articles={news} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
