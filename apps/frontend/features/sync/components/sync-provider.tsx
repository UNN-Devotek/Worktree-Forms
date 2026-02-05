
'use client';

import React, { useEffect } from 'react';
// import { SyncEngine } from '../services/sync-engine';
import { toast } from 'sonner';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register listeners
    /*
    const unsubStart = SyncEngine.on('sync-start', () => {
       toast.loading('Syncing offline data...', { id: 'sync-status' });
    });

    const unsubComplete = SyncEngine.on('sync-complete', (count: number) => {
       toast.success(`Sync complete. Uploaded ${count} items.`, { id: 'sync-status', duration: 3000 });
    });

    const unsubFailed = SyncEngine.on('sync-failed', () => {
       toast.error('Sync failed. Will retry automatically.', { id: 'sync-status', duration: 4000 });
       // Keep the toast or dismiss? Error should stay visible for a bit.
    });

    const unsubOnline = SyncEngine.on('online', () => {
       // Optional: explicit "back online" toast is handled by OfflineSyncProvider? 
       // OfflineSyncProvider handles "You are back online".
       // SyncProvider handles the *data* aspect.
       // We can trigger processing here just in case, but SyncEngine handles its own listeners too.
       // SyncEngine.processQueue(); // Already handled in SyncEngine constructor/listeners
    });

    return () => {
      unsubStart();
      unsubComplete();
      unsubFailed();
      unsubOnline();
    };
    */
  }, []);

  return <>{children}</>;
}
