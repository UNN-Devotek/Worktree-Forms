
'use client';

import React from 'react';
import { toast } from 'sonner';
import { OfflineIndicator } from './OfflineIndicator';
import { t } from '@/lib/i18n';

/**
 * Finding #1 (R3): Toast strings now wrapped in t() — no hardcoded English.
 * Finding #1 (R2): SyncProvider no longer registers duplicate online/offline listeners.
 * OfflineIndicator owns the banner; SyncProvider owns only toast notifications.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const handleOnline = () => {
      toast.success(t('sync.online', 'Back online — syncing changes...'), {
        id: 'network-status',
        duration: 3000,
      });
    };
    const handleOffline = () => {
      toast.warning(t('sync.offline', 'You are offline'), {
        id: 'network-status',
        duration: Infinity,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <OfflineIndicator />
      {children}
    </>
  );
}
