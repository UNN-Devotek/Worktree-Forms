'use client';

import { useState, useEffect } from 'react';
import { DashboardService, AggregatedMetrics, RecentItem, FavoriteItem, NewsArticle } from '@/services/dashboard.service';

interface DashboardData {
    metrics: AggregatedMetrics;
    recent: RecentItem[];
    favorites: FavoriteItem[];
    news: NewsArticle[];
    isLoading: boolean;
}

const emptyMetrics: AggregatedMetrics = {
    totalProjects: 0, totalForms: 0, activeForms: 0, totalSubmissions: 0,
    thisWeekSubmissions: 0, totalTasks: 0, openTasks: 0, totalSheets: 0,
    totalRoutes: 0, totalFiles: 0,
};

export function useDashboardData(): DashboardData {
    const [metrics, setMetrics] = useState<AggregatedMetrics>(emptyMetrics);
    const [recent, setRecent] = useState<RecentItem[]>([]);
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            // Ensure backend auth token cookie is set before making API calls.
            // After login only the NextAuth session cookie exists; the Express
            // backend needs its own JWT in the access_token cookie.
            try {
                await fetch('/api/auth/backend-token', { credentials: 'include' });
            } catch {
                // Non-fatal — apiRequest has its own 401 retry fallback
            }

            const [m, r, f, n] = await Promise.all([
                DashboardService.getAggregatedMetrics(),
                DashboardService.getRecentItems(),
                DashboardService.getFavorites(),
                DashboardService.getNews(),
            ]);
            if (!cancelled) {
                setMetrics(m);
                setRecent(r);
                setFavorites(f);
                setNews(n);
                setIsLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    return { metrics, recent, favorites, news, isLoading };
}
