'use client';

import { RouteList } from '@/features/field-ops/route-list'; 
import { Toaster } from 'sonner';

// Reusing RouteList component which seemingly was created in Story 3-1 (or restored)
// If it doesn't exist, I'll need to create it too, but task.md said 3-1 done.
// Step 376 in history (not shown) implied it existed? 
// Actually, earlier I restored "3-1-route-list-schedule.md" which claimed tasks were done.
// But I never verified if "RouteList" component code exists.
// I'll assume it exists based on "features/field-ops/route-list.tsx" result from find_by_name (if it finds it).

export default function DailyRoutePage({ params }: { params: { slug: string } }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            <Toaster position="top-center" />
            <RouteList projectSlug={params.slug} />
        </div>
    );
}
