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
    
    const userId = (req as any).user.id;

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
    const userId = (req as any).user.id;

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
