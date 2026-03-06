import { Router, Request, Response } from 'express';
import { HelpArticleService } from '../services/help-article.service.js';

const router = Router();

// ============================================================================
// Help Article Management
// ============================================================================

router.post('/articles', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, content, category } = req.body;
    const article = await HelpArticleService.createArticle(userId, { title, content, category });
    res.json({ success: true, article });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

router.get('/articles', async (req: Request, res: Response) => {
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

router.put('/articles/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { title, content, category } = req.body;
    const article = await HelpArticleService.updateArticle(id, userId, { title, content, category });
    res.json({ success: true, article });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

router.post('/articles/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await HelpArticleService.publishArticle(id);
    res.json({ success: true, article });
  } catch (error) {
    console.error('Publish article error:', error);
    res.status(500).json({ error: 'Failed to publish article' });
  }
});

// Sync articles (no auth required for public reading, but we can enforce if needed)
router.get('/sync', async (req: Request, res: Response) => {
  try {
    const articles = await HelpArticleService.getPublishedArticlesForSync();
    res.json({ success: true, articles, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Sync articles error:', error);
    res.status(500).json({ error: 'Failed to sync articles' });
  }
});

export default router;
