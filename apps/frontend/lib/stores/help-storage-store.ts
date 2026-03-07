import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OfflineArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: Record<string, unknown>[];
  updatedAt: string;
  publishedAt: string;
}

export interface SyncStatus {
  lastSync: number | null;
  articleCount: number;
}

interface HelpStorageState {
  articles: OfflineArticle[];
  status: SyncStatus;
  saveArticles: (articles: OfflineArticle[]) => void;
  getArticles: () => OfflineArticle[];
  getStatus: () => SyncStatus;
  searchArticles: (query: string) => OfflineArticle[];
  clear: () => void;
}

export const useHelpStorageStore = create<HelpStorageState>()(
  persist(
    (set, get) => ({
      articles: [],
      status: { lastSync: null, articleCount: 0 },

      saveArticles: (articles) =>
        set({
          articles,
          status: { lastSync: Date.now(), articleCount: articles.length },
        }),

      getArticles: () => get().articles,

      getStatus: () => get().status,

      searchArticles: (query) => {
        const articles = get().articles;
        if (!query) return articles;
        const lowerQuery = query.toLowerCase();
        return articles.filter(
          (article) =>
            article.title.toLowerCase().includes(lowerQuery) ||
            article.category.toLowerCase().includes(lowerQuery),
        );
      },

      clear: () =>
        set({
          articles: [],
          status: { lastSync: null, articleCount: 0 },
        }),
    }),
    {
      name: 'worktree-help-storage',
      partialize: (state) => ({
        articles: state.articles,
        status: state.status,
      }),
    },
  ),
);
