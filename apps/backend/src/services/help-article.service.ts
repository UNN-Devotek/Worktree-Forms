import { HelpArticleEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

export class HelpArticleService {
  /**
   * Create a new help article (draft by default)
   */
  static async createArticle(authorId: string, data: { title: string; content: unknown; category?: string }) {
    const articleId = nanoid();
    const article = await HelpArticleEntity.create({
      articleId,
      title: data.title,
      content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
      category: data.category || 'general',
      authorId,
      status: 'DRAFT',
    }).go();

    return article.data;
  }

  /**
   * Update article
   */
  static async updateArticle(articleId: string, _userId: string, data: { title?: string; content?: unknown; category?: string }) {
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.title) updates.title = data.title;
    if (data.content) updates.content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    if (data.category) updates.category = data.category;

    await HelpArticleEntity.patch({ articleId })
      .set(updates as Parameters<typeof HelpArticleEntity.patch>[0] extends infer T ? Record<string, unknown> : never)
      .go();

    const result = await HelpArticleEntity.get({ articleId }).go();
    return result.data;
  }

  /**
   * Publish an article
   */
  static async publishArticle(articleId: string) {
    await HelpArticleEntity.patch({ articleId })
      .set({ status: 'PUBLISHED', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .go();

    const result = await HelpArticleEntity.get({ articleId }).go();
    return result.data;
  }

  /**
   * List articles with filters
   */
  static async listArticles(filters: { category?: string; status?: string }) {
    if (filters.category) {
      const result = await HelpArticleEntity.query.byCategory({ category: filters.category }).go();
      if (filters.status) {
        return result.data.filter((a) => a.status === filters.status);
      }
      return result.data;
    }
    // Scan all articles (no efficient way without category in DynamoDB)
    const result = await HelpArticleEntity.scan.go();
    let articles = result.data;
    if (filters.status) {
      articles = articles.filter((a) => a.status === filters.status);
    }
    return articles;
  }

  /**
   * Get article by ID
   */
  static async getArticle(articleId: string) {
    const result = await HelpArticleEntity.get({ articleId }).go();
    return result.data;
  }

  /**
   * Get all published articles for offline sync
   */
  static async getPublishedArticlesForSync() {
    const result = await HelpArticleEntity.scan
      .where((attr, op) => op.eq(attr.status, 'PUBLISHED'))
      .go();
    return result.data;
  }
}
