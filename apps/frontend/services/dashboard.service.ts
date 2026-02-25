import { apiClient } from '@/lib/api';

export interface DashboardMetrics {
    totalSubmissions: number;
    statsByForm: {
        formName: string;
        version: number;
        count: number;
    }[];
    plan: string;
    storageUsage: number | string;
    submissionCount: number;
}

export interface ActivityItem {
    id: number;
    type: 'submission';
    user: string;
    action: string;
    target: string;
    timestamp: string;
}

export const DashboardService = {
    async getProjectMetrics(projectId: string): Promise<DashboardMetrics> {
        try {
            const json = await apiClient<{ success: boolean; data: DashboardMetrics }>(`/api/projects/${projectId}/metrics`);
            return json.success ? json.data : { totalSubmissions: 0, statsByForm: [], plan: 'FREE', storageUsage: 0, submissionCount: 0 };
        } catch (error) {
            console.error('getProjectMetrics error:', error);
            return { totalSubmissions: 0, statsByForm: [], plan: 'FREE', storageUsage: 0, submissionCount: 0 };
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
    }
};
