import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserEntity } from '../lib/dynamo/index.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

const updatePreferencesSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    locale: z.string().min(2).max(10).optional(),
  })
  .catchall(z.unknown());

// ==========================================
// USER PREFERENCES (DynamoDB-backed)
// ==========================================
// Preferences are stored on the UserEntity record.
// Well-known keys (theme, locale) are top-level attributes.
// Custom key-value preferences are merged into UserEntity.settings.
// No in-memory cache -- safe for multi-instance Fargate deployments.

/**
 * GET /api/preferences/me
 * Returns all preferences for the authenticated user.
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const userId = (req as Request & { user?: { id: string } }).user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const result = await UserEntity.get({ userId }).go();
    const user = result.data;
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const preferences = {
      theme: user.theme ?? 'system',
      locale: user.locale ?? 'en',
    };
    res.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch preferences' });
  }
});

/**
 * PATCH /api/preferences/me
 * Body: { theme?, locale?, ...customPrefs }
 * Updates preferences for the authenticated user.
 */
router.patch('/me', authenticate, async (req: Request, res: Response) => {
  const userId = (req as Request & { user?: { id: string } }).user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const parsed = updatePreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { theme, locale } = parsed.data;

  try {
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (theme) updates.theme = theme;
    if (locale) updates.locale = locale;

    await UserEntity.patch({ userId }).set(updates).go();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

/**
 * GET /api/preferences/:key
 * Returns a single preference value for the authenticated user.
 * Supports well-known keys: theme, locale.
 */
router.get('/:key', authenticate, async (req: Request, res: Response) => {
  const { key } = req.params;
  const userId = (req as Request & { user?: { id: string } }).user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    if (key === 'theme' || key === 'locale') {
      const userResult = await UserEntity.get({ userId }).go();
      if (userResult.data) {
        return res.json({
          success: true,
          data: userResult.data[key] ?? null,
        });
      }
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Unknown preference key
    res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error fetching preference:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch preference' });
  }
});

/**
 * POST /api/preferences
 * Body: { key, value }
 * Sets a single preference value. Kept for backward compatibility.
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  const { key, value } = req.body;
  const userId = (req as Request & { user?: { id: string } }).user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    if (key === 'theme' || key === 'locale') {
      await UserEntity.patch({ userId })
        .set({ [key]: value, updatedAt: new Date().toISOString() })
        .go();
      return res.json({ success: true, data: { userId, key, value } });
    }

    // For unknown keys, acknowledge but do not persist (no in-memory cache)
    res.json({ success: true, data: { userId, key, value, persisted: false } });
  } catch (error) {
    console.error('Error saving preference:', error);
    res.status(500).json({ success: false, error: 'Failed to save preference' });
  }
});

export default router;
