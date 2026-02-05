"use client";

import { OfflineHelpCenter } from '@/features/help-center/components/OfflineHelpCenter';

export default function MobileHelpPage() {
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Mobile Offline Help</h1>
        <p className="text-muted-foreground">
          Access guides and procedures even without an internet connection.
        </p>
      </div>
      
      <OfflineHelpCenter />
    </div>
  );
}
