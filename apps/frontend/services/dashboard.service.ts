// Utility import removed as fetch is relative

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
            const res = await fetch(`/api/projects/${projectId}/metrics`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch metrics');
            const json = await res.json();
            return json.success ? json.data : { totalSubmissions: 0, statsByForm: [], plan: 'FREE', storageUsage: 0, submissionCount: 0 };
        } catch (error) {
            console.error('getProjectMetrics error:', error);
            // Return empty fallback
            return { totalSubmissions: 0, statsByForm: [], plan: 'FREE', storageUsage: 0, submissionCount: 0 };
        }
    },

    async getActivityFeed(projectId: string): Promise<ActivityItem[]> {
        try {
            const res = await fetch(`/api/projects/${projectId}/activity`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch activity');
            const json = await res.json();
            return json.success ? json.data : [];
        } catch (error) {
            console.error('getActivityFeed error:', error);
            return [];
        }
    }
};
