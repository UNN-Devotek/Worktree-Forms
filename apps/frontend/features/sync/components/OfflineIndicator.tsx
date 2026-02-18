'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { t } from '@/lib/i18n';

/**
 * Story 1.6 AC: "the OfflineIndicator banner appears when network is disconnected"
 * Fixed banner at top of viewport, animates in/out.
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label={t('offline.indicator.label', 'Network status')}
      className={[
        'fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2',
        'bg-amber-500 text-amber-950 text-sm font-medium py-2 px-4',
        'transition-transform duration-300 ease-in-out',
        isOffline ? 'translate-y-0' : '-translate-y-full',
      ].join(' ')}
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        {t('offline.indicator.message', 'You are offline — changes will sync when reconnected')}
      </span>
    </div>
  );
}
