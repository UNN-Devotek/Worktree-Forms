'use client';

import { useEffect } from 'react';
import { DashboardService } from '@/services/dashboard.service';

export function useRecentTracking(item: {
    itemId: string;
    itemType: string;
    itemName: string;
    projectId: string;
    projectSlug: string;
} | null) {
    useEffect(() => {
        if (!item) return;
        DashboardService.recordRecentItem(item);
    }, [item?.itemId]); // eslint-disable-line react-hooks/exhaustive-deps
}
