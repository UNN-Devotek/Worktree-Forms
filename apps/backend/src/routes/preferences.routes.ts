import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

const router = Router();

// ==========================================
// USER PREFERENCES
// ==========================================

router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { projectId } = req.query; // Optional scoping
    
    // In a real app, strict auth check here.
    // Assuming 'x-user-id' header or similar is passed from frontend/gateway
    // For now, defaulting to a known user if not present (dev mode)
    const userId = (req.headers['x-user-id'] as string) || 'user-1'; 

    const where: any = {
      userId: userId,
      key,
    };

    if (projectId) {
      where.projectId = String(projectId);
    }

    const pref = await prisma.userPreference.findFirst({ // findFirst to match composite unique if needed or just convenient
      where: {
        userId: userId,
        key: key,
        projectId: projectId ? String(projectId) : null
      }
    });

    res.json(pref ? pref.value : null);
  } catch (error) {
    console.error('Error fetching preference:', error);
    res.status(500).json({ error: 'Failed to fetch preference' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { key, value, projectId } = req.body;
    const userId = (req.headers['x-user-id'] as string) || 'user-1';

    const pref = await prisma.userPreference.upsert({
      where: {
        userId_key_projectId: {
          userId,
          key,
          projectId: (projectId ? String(projectId) : null) as any
        }
      },
      update: {
        value
      },
      create: {
        userId,
        key,
        value,
        projectId: (projectId ? String(projectId) : null) as any
      }
    });

    res.json(pref);
  } catch (error) {
    console.error('Error saving preference:', error);
    res.status(500).json({ error: 'Failed to save preference' });
  }
});

export default router;
