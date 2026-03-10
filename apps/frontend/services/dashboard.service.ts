import { apiClient } from '@/lib/api';

export interface DashboardMetrics {
    totalSubmissions: number;
    thisWeekSubmissions: number;
    statsByForm: { formName: string; count: number }[];
    formCount: number;
    activeForms: number;
    memberCount: number;
    taskCount: number;
    openTaskCount: number;
    routeCount: number;
    sheetCount: number;
    fileCount: number;
}

export interface ActivityItem {
    id: number;
    type: 'submission';
    user: string;
    action: string;
    target: string;
    timestamp: string;
}

export interface AggregatedMetrics {
    totalProjects: number;
    totalForms: number;
    activeForms: number;
    totalSubmissions: number;
    thisWeekSubmissions: number;
    totalTasks: number;
    openTasks: number;
    totalSheets: number;
    totalRoutes: number;
    totalFiles: number;
}

export interface RecentItem {
    itemId: string;
    itemType: string;
    itemName: string;
    projectId: string;
    projectSlug: string;
    accessedAt: string;
}

export interface FavoriteItem {
    itemId: string;
    itemType: string;
    itemName: string;
    projectId: string;
    projectSlug: string;
    createdAt: string;
}

export interface NewsArticle {
    articleId: string;
    title: string;
    content: string;
    publishedAt: string;
    authorId?: string;
}

export const DashboardService = {
    async getProjectMetrics(projectId: string): Promise<DashboardMetrics> {
        try {
            const json = await apiClient<{ success: boolean; data: DashboardMetrics }>(`/api/projects/${projectId}/metrics`);
            const empty: DashboardMetrics = { totalSubmissions: 0, thisWeekSubmissions: 0, statsByForm: [], formCount: 0, activeForms: 0, memberCount: 0, taskCount: 0, openTaskCount: 0, routeCount: 0, sheetCount: 0, fileCount: 0 };
            return json.success ? json.data : empty;
        } catch (error) {
            console.error('getProjectMetrics error:', error);
            return { totalSubmissions: 0, thisWeekSubmissions: 0, statsByForm: [], formCount: 0, activeForms: 0, memberCount: 0, taskCount: 0, openTaskCount: 0, routeCount: 0, sheetCount: 0, fileCount: 0 };
        }
    },

    async getActivityFeed(projectId: string): Promise<ActivityItem[]> {
        try {
            const json = await apiClient<{ success: boolean; data: ActivityItem[] }>(`/api/projects/${projectId}/activity`);
            return json.success ? json.data : [];
        } catch (error) {
            console.error('getActivityFeed error:', error);
            return [];
        }
    },

    async getAggregatedMetrics(): Promise<AggregatedMetrics> {
        try {
            const json = await apiClient<{ success: boolean; data: AggregatedMetrics }>('/api/dashboard/metrics');
            const empty: AggregatedMetrics = { totalProjects: 0, totalForms: 0, activeForms: 0, totalSubmissions: 0, thisWeekSubmissions: 0, totalTasks: 0, openTasks: 0, totalSheets: 0, totalRoutes: 0, totalFiles: 0 };
            return json.success ? json.data : empty;
        } catch (error) {
            console.error('getAggregatedMetrics error:', error);
            return { totalProjects: 0, totalForms: 0, activeForms: 0, totalSubmissions: 0, thisWeekSubmissions: 0, totalTasks: 0, openTasks: 0, totalSheets: 0, totalRoutes: 0, totalFiles: 0 };
        }
    },

    async getRecentItems(): Promise<RecentItem[]> {
        try {
            const json = await apiClient<{ success: boolean; data: RecentItem[] }>('/api/dashboard/recent');
            return json.success ? json.data : [];
        } catch (error) {
            console.error('getRecentItems error:', error);
            return [];
        }
    },

    async recordRecentItem(item: Omit<RecentItem, 'accessedAt'>): Promise<void> {
        try {
            await apiClient('/api/dashboard/recent', {
                method: 'POST',
                body: JSON.stringify(item),
            });
        } catch (error) {
            console.error('recordRecentItem error:', error);
        }
    },

    async getFavorites(): Promise<FavoriteItem[]> {
        try {
            const json = await apiClient<{ success: boolean; data: FavoriteItem[] }>('/api/dashboard/favorites');
            return json.success ? json.data : [];
        } catch (error) {
            console.error('getFavorites error:', error);
            return [];
        }
    },

    async addFavorite(item: Omit<FavoriteItem, 'createdAt'>): Promise<void> {
        try {
            await apiClient('/api/dashboard/favorites', {
                method: 'POST',
                body: JSON.stringify(item),
            });
        } catch (error) {
            console.error('addFavorite error:', error);
        }
    },

    async removeFavorite(itemType: string, itemId: string): Promise<void> {
        try {
            await apiClient(`/api/dashboard/favorites/${itemType}/${itemId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('removeFavorite error:', error);
        }
    },

    async getNews(): Promise<NewsArticle[]> {
        try {
            const json = await apiClient<{ success: boolean; data: NewsArticle[] }>('/api/dashboard/news');
            return json.success ? json.data : [];
        } catch (error) {
            console.error('getNews error:', error);
            return [];
        }
    },
};
