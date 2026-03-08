import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'article-nanoid-001') }));

vi.mock('../../lib/dynamo/index.js', () => ({
  HelpArticleEntity: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    scan: {
      go: vi.fn(),
      where: vi.fn(),
    },
    query: {
      byCategory: vi.fn(),
    },
  },
}));

import { HelpArticleService } from '../../services/help-article.service.js';
import { HelpArticleEntity } from '../../lib/dynamo/index.js';

const mockEntity = HelpArticleEntity as {
  create: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  scan: { go: ReturnType<typeof vi.fn>; where: ReturnType<typeof vi.fn> };
  query: { byCategory: ReturnType<typeof vi.fn> };
};

describe('HelpArticleService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('createArticle', () => {
    it('[P0] creates article with DRAFT status', async () => {
      const fakeData = { articleId: 'article-nanoid-001', status: 'DRAFT' };
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: fakeData }) });

      const result = await HelpArticleService.createArticle('author-1', {
        title: 'Getting Started',
        content: 'Step 1...',
        category: 'onboarding',
      });

      const arg = mockEntity.create.mock.calls[0][0];
      expect(arg.status).toBe('DRAFT');
      expect(arg.authorId).toBe('author-1');
      expect(arg.title).toBe('Getting Started');
      expect(arg.category).toBe('onboarding');
      expect(result).toEqual(fakeData);
    });

    it('[P0] defaults category to "general" when not provided', async () => {
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await HelpArticleService.createArticle('author-1', { title: 'FAQ', content: 'Q&A' });

      const arg = mockEntity.create.mock.calls[0][0];
      expect(arg.category).toBe('general');
    });

    it('[P1] JSON-stringifies object content', async () => {
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await HelpArticleService.createArticle('author-1', {
        title: 'Rich Content',
        content: { blocks: [{ type: 'paragraph', text: 'Hello' }] },
      });

      const arg = mockEntity.create.mock.calls[0][0];
      expect(typeof arg.content).toBe('string');
      const parsed = JSON.parse(arg.content);
      expect(parsed.blocks[0].type).toBe('paragraph');
    });
  });

  describe('publishArticle', () => {
    it('[P0] sets status to PUBLISHED and sets publishedAt', async () => {
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockEntity.patch.mockReturnValue({ set: mockSet });
      mockEntity.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { articleId: 'a1', status: 'PUBLISHED' } }),
      });

      const result = await HelpArticleService.publishArticle('a1');

      expect(mockEntity.patch).toHaveBeenCalledWith({ articleId: 'a1' });
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.status).toBe('PUBLISHED');
      expect(setArg.publishedAt).toBeDefined();
      expect(result?.status).toBe('PUBLISHED');
    });
  });

  describe('getArticle', () => {
    it('[P0] retrieves article by id', async () => {
      const article = { articleId: 'a1', title: 'Guide', status: 'PUBLISHED' };
      mockEntity.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: article }) });

      const result = await HelpArticleService.getArticle('a1');
      expect(result).toEqual(article);
      expect(mockEntity.get).toHaveBeenCalledWith({ articleId: 'a1' });
    });
  });

  describe('listArticles', () => {
    it('[P0] queries byCategory when category filter is given', async () => {
      const articles = [
        { articleId: 'a1', category: 'onboarding', status: 'PUBLISHED' },
        { articleId: 'a2', category: 'onboarding', status: 'DRAFT' },
      ];
      mockEntity.query.byCategory.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: articles }) });

      const result = await HelpArticleService.listArticles({ category: 'onboarding' });
      expect(result).toHaveLength(2);
      expect(mockEntity.query.byCategory).toHaveBeenCalledWith({ category: 'onboarding' });
    });

    it('[P1] filters by status when both category and status are provided', async () => {
      const articles = [
        { articleId: 'a1', category: 'faq', status: 'PUBLISHED' },
        { articleId: 'a2', category: 'faq', status: 'DRAFT' },
      ];
      mockEntity.query.byCategory.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: articles }) });

      const result = await HelpArticleService.listArticles({ category: 'faq', status: 'PUBLISHED' });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('PUBLISHED');
    });

    it('[P1] scans all when no category filter', async () => {
      mockEntity.scan.go.mockResolvedValue({ data: [{ articleId: 'a1', status: 'PUBLISHED' }] });

      const result = await HelpArticleService.listArticles({});
      // Should return the scanned data (no category filter applied)
      expect(result).toHaveLength(1);
      expect(result[0].articleId).toBe('a1');
    });
  });
});
