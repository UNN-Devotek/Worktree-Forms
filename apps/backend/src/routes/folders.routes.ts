import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.union([z.string(), z.number()]).optional().nullable(),
  projectId: z.string().optional().nullable(),
});

// ==========================================
// FOLDER ENDPOINTS
// ==========================================

// Get folders — scoped to projects the authenticated user is a member of
// If ?projectId= is provided, return only folders for that project (after verifying membership)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const projectIdFilter = req.query.projectId as string | undefined;

    if (projectIdFilter) {
      // Verify user is a member of the requested project
      const member = await prisma.projectMember.findFirst({
        where: { projectId: projectIdFilter, userId },
        select: { id: true },
      });
      const systemRole = (req as any).user?.systemRole;
      if (!member && systemRole !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const folders = await prisma.folder.findMany({
        where: { projectId: projectIdFilter },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ success: true, data: { folders } });
    }

    // Default: return all folders across user's projects
    const userProjects = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = userProjects.map((p: { projectId: string }) => p.projectId);

    const folders = await prisma.folder.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { folders } });
  } catch (error) {
    console.error('Fetch Folders Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch folders' });
  }
});

// Create folder
router.post('/', async (req: Request, res: Response) => {
    const parsed = createFolderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }
    const { name, parentId, projectId } = parsed.data;
    try {
        const folder = await prisma.folder.create({
            data: {
                name,
                parentId: parentId ? parseInt(String(parentId)) : null,
                projectId: projectId ?? null,
            }
        });
        res.json({ success: true, data: { folder } });
    } catch (error) {
        console.error('Create Folder Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create folder' });
    }
});

// Update folder
router.put('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid folder ID' });
    }
    const { name, parentId } = req.body;
    try {
        const folder = await prisma.folder.update({
            where: { id },
            data: {
                name,
                parentId: parentId === undefined ? undefined : (parentId ? parseInt(parentId) : null)
            }
        });
        res.json({ success: true, data: { folder } });
    } catch (error) {
        console.error('Update Folder Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update folder' });
    }
});

// Delete folder
router.delete('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid folder ID' });
    }
    try {
        // Move forms to root
        await prisma.form.updateMany({
            where: { folderId: id },
            data: { folderId: null }
        });
        
        // Delete folder
        await prisma.folder.delete({ where: { id } });
        res.json({ success: true, message: 'Folder deleted' });
    } catch (error) {
        console.error('Delete Folder Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete folder' });
    }
});

export default router;
