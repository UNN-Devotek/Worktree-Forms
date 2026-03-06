import { Router, Request, Response } from 'express';
import { UserEntity } from '../lib/dynamo/index.js';

const router = Router();

// ==========================================
// USER PREFERENCES
// ==========================================
// Note: In the DynamoDB model, preferences are stored on the UserEntity
// as part of the user record (theme, locale). For custom key-value
// preferences, we use a simple in-memory cache as a stub until a
// PreferenceEntity is added.

const preferenceCache = new Map<string, unknown>();

function prefKey(userId: string, key: string, projectId?: string): string {
  return `${userId}:${key}:${projectId ?? 'global'}`;
}

router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const projectId = req.query.projectId as string | undefined;
    const userId = (req as any).user.id;

    // Check well-known user attributes first
    if (key === 'theme' || key === 'locale') {
      const userResult = await UserEntity.get({ userId }).go();
      if (userResult.data) {
        return res.json(userResult.data[key as 'theme' | 'locale'] ?? null);
      }
    }

    const cached = preferenceCache.get(prefKey(userId, key, projectId));
    res.json(cached ?? null);
  } catch (error) {
    console.error('Error fetching preference:', error);
    res.status(500).json({ error: 'Failed to fetch preference' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { key, value, projectId } = req.body;
    const userId = (req as any).user.id;

    // Persist well-known user attributes
    if (key === 'theme' || key === 'locale') {
      await UserEntity.patch({ userId })
        .set({ [key]: value, updatedAt: new Date().toISOString() })
        .go();
      return res.json({ userId, key, value });
    }

    preferenceCache.set(prefKey(userId, key, projectId), value);
    res.json({ userId, key, value, projectId: projectId ?? null });
  } catch (error) {
    console.error('Error saving preference:', error);
    res.status(500).json({ error: 'Failed to save preference' });
  }
});

export default router;
