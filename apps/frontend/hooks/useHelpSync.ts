import { useState, useEffect } from 'react';
import { HelpStorage, SyncStatus } from '../lib/help-storage';

export function useHelpSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>({ lastSync: null, articleCount: 0 });
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Load initial status
  useEffect(() => {
    setStatus(HelpStorage.getStatus());
    
    // Check if we are online/offline
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOfflineMode(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncArticles = async () => {
    if (!navigator.onLine) {
      setSyncError('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch('/api/help/sync');
      if (!response.ok) throw new Error('Failed to fetch articles');
      
      const data = await response.json();
      if (data.success && Array.isArray(data.articles)) {
        const saved = HelpStorage.saveArticles(data.articles);
        if (saved) {
          setStatus(HelpStorage.getStatus());
        } else {
          setSyncError('Failed to save to local storage (quota exceeded?)');
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getLocalArticles = (query: string = '') => {
    return HelpStorage.searchArticles(query);
  };

  return {
    isSyncing,
    syncError,
    status,
    isOfflineMode,
    syncArticles,
    getLocalArticles
  };
}
