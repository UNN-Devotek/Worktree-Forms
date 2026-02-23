'use client';

import { use } from 'react';
import { RouteList } from '@/features/field-ops/route-list';
import { Toaster } from 'sonner';

export default function DailyRoutePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            <Toaster position="top-center" />
            <RouteList projectSlug={slug} />
        </div>
    );
}
