
import { useHelpStorageStore, OfflineArticle, SyncStatus } from './stores/help-storage-store';

export type { OfflineArticle, SyncStatus };

/**
 * Facade over the Zustand help storage store.
 * Maintains the same API surface for backward compatibility.
 */
export const HelpStorage = {
  saveArticles: (articles: OfflineArticle[]): boolean => {
    try {
      useHelpStorageStore.getState().saveArticles(articles);
      return true;
    } catch {
      return false;
    }
  },

  getArticles: (): OfflineArticle[] => {
    return useHelpStorageStore.getState().getArticles();
  },

  getStatus: (): SyncStatus => {
    return useHelpStorageStore.getState().getStatus();
  },

  searchArticles: (query: string): OfflineArticle[] => {
    return useHelpStorageStore.getState().searchArticles(query);
  },

  clear: () => {
    useHelpStorageStore.getState().clear();
  },
};
