
export interface OfflineArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: any;
  updatedAt: string;
  publishedAt: string;
}

export interface SyncStatus {
  lastSync: number | null; // Timestamp
  articleCount: number;
}

const STORAGE_KEYS = {
  ARTICLES: 'worktree_offline_articles',
  STATUS: 'worktree_offline_status'
};

export const HelpStorage = {
  saveArticles: (articles: OfflineArticle[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
      const status: SyncStatus = {
        lastSync: Date.now(),
        articleCount: articles.length
      };
      localStorage.setItem(STORAGE_KEYS.STATUS, JSON.stringify(status));
      return true;
    } catch (error) {
      console.error('Failed to save articles to offline storage:', error);
      return false;
    }
  },

  getArticles: (): OfflineArticle[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ARTICLES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  getStatus: (): SyncStatus => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATUS);
      return data ? JSON.parse(data) : { lastSync: null, articleCount: 0 };
    } catch {
      return { lastSync: null, articleCount: 0 };
    }
  },

  searchArticles: (query: string): OfflineArticle[] => {
    const articles = HelpStorage.getArticles();
    if (!query) return articles;
    
    const lowerQuery = query.toLowerCase();
    return articles.filter(article => 
      article.title.toLowerCase().includes(lowerQuery) || 
      article.category.toLowerCase().includes(lowerQuery)
    );
  },
  
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.ARTICLES);
    localStorage.removeItem(STORAGE_KEYS.STATUS);
  }
};
