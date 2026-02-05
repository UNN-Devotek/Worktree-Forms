import { prisma } from '../db.js';

export class HelpArticleService {
  /**
   * Create a new help article (draft by default)
   */
  static async createArticle(authorId: string, data: { title: string; content: any; category?: string; projectId?: string }) {
    const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const article = await prisma.helpArticle.create({
      data: {
        title: data.title,
        slug: `${slug}-${Date.now()}`, // Ensure uniqueness
        content: data.content,
        category: data.category || 'General',
        authorId,
        projectId: data.projectId,
        status: 'draft'
      }
    });

    // Create initial version
    await prisma.helpArticleVersion.create({
      data: {
        articleId: article.id,
        version: 1,
        content: data.content,
        createdById: authorId,
        changelog: 'Initial version'
      }
    });

    return article;
  }

  /**
   * Update article and create new version
   */
  static async updateArticle(articleId: string, userId: string, data: { title?: string; content?: any; category?: string; changelog?: string }) {
    const article = await prisma.helpArticle.findUnique({
      where: { id: articleId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
    });

    if (!article) throw new Error('Article not found');

    const latestVersion = article.versions[0]?.version || 0;

    // Update article
    const updated = await prisma.helpArticle.update({
      where: { id: articleId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.category && { category: data.category })
      }
    });

    // Create new version if content changed
    if (data.content) {
      await prisma.helpArticleVersion.create({
        data: {
          articleId,
          version: latestVersion + 1,
          content: data.content,
          createdById: userId,
          changelog: data.changelog || 'Updated content'
        }
      });
    }

    return updated;
  }

  /**
   * Publish an article
   */
  static async publishArticle(articleId: string) {
    return prisma.helpArticle.update({
      where: { id: articleId },
      data: {
        status: 'published',
        publishedAt: new Date()
      }
    });
  }

  /**
   * List articles with filters
   */
  static async listArticles(filters: { category?: string; status?: string; projectId?: string }) {
    return prisma.helpArticle.findMany({
      where: {
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.projectId && { projectId: filters.projectId })
      },
      include: {
        author: { select: { id: true, name: true, email: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Get article by slug
   */
  static async getArticleBySlug(slug: string) {
    return prisma.helpArticle.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });
  }

  /**
   * Get article versions
   */
  static async getArticleVersions(articleId: string) {
    return prisma.helpArticleVersion.findMany({
      where: { articleId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { version: 'desc' }
    });
  }
  /**
   * Get all published articles for offline sync
   */
  static async getPublishedArticlesForSync() {
    return prisma.helpArticle.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        content: true,
        updatedAt: true,
        publishedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
