import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { HelpArticleService } from '../services/help-article.service.js';
import { publicRateLimiter } from '../middleware/rateLimiter.js';

const articleSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(100000),
  category: z.string().max(100).optional(),
});

const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (user?.systemRole !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

// ============================================================================
// Help Article Management
// ============================================================================

router.post('/articles', requireAdmin, async (req: Request, res: Response) => {
  try {
    const parsed = articleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }
    const userId = req.user!.id;
    const article = await HelpArticleService.createArticle(userId, parsed.data);
    res.json({ success: true, article });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

router.get('/articles', publicRateLimiter, async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;
    const articles = await HelpArticleService.listArticles({
      category: category as string,
      status: status as string,
    });
    res.json({ success: true, articles });
  } catch (error) {
    console.error('List articles error:', error);
    res.status(500).json({ error: 'Failed to list articles' });
  }
});

router.get('/articles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await HelpArticleService.getArticle(id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ success: true, article });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to get article' });
  }
});

router.put('/articles/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const parsed = articleSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }
    const userId = req.user!.id;
    const { id } = req.params;
    const article = await HelpArticleService.updateArticle(id, userId, parsed.data);
    res.json({ success: true, article });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

router.post('/articles/:id/publish', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await HelpArticleService.publishArticle(id);
    res.json({ success: true, article });
  } catch (error) {
    console.error('Publish article error:', error);
    res.status(500).json({ error: 'Failed to publish article' });
  }
});

// Sync articles (public endpoint — rate limited to prevent harvesting)
router.get('/sync', publicRateLimiter, async (req: Request, res: Response) => {
  try {
    const articles = await HelpArticleService.getPublishedArticlesForSync();
    res.json({ success: true, articles, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Sync articles error:', error);
    res.status(500).json({ error: 'Failed to sync articles' });
  }
});

export default router;
