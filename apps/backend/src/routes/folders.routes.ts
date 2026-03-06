import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { FolderEntity } from '../lib/dynamo/index.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';
import { nanoid } from 'nanoid';

const router = Router();

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(200),
  projectId: z.string().min(1, 'projectId is required'),
  parentFolderId: z.string().optional(),
  description: z.string().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});

// ==========================================
// FOLDER ENDPOINTS
// ==========================================

/**
 * GET /api/folders
 * Query param: projectId (required)
 * Returns all folders for a project, ordered alphabetically by name.
 */
router.get(
  '/',
  authenticate,
  requireProjectAccess('VIEWER'),
  async (req: Request, res: Response) => {
    const projectId = req.query.projectId as string;
    try {
      const result = await FolderEntity.query.byProject({ projectId }).go();
      res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('Fetch Folders Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch folders' });
    }
  },
);

/**
 * POST /api/folders
 * Body: { name, projectId, parentFolderId?, description? }
 * Creates a new folder within a project.
 */
router.post(
  '/',
  authenticate,
  requireProjectAccess('EDITOR'),
  async (req: Request, res: Response) => {
    const parsed = createFolderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }

    const userId = (req as Request & { user?: { id: string } }).user?.id ?? 'unknown';
    const folderId = nanoid();
    const now = new Date().toISOString();

    try {
      const folder = await FolderEntity.create({
        folderId,
        projectId: parsed.data.projectId,
        name: parsed.data.name,
        parentFolderId: parsed.data.parentFolderId,
        description: parsed.data.description,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      }).go();
      res.status(201).json({ success: true, data: folder.data });
    } catch (error) {
      console.error('Create Folder Error:', error);
      res.status(500).json({ success: false, error: 'Failed to create folder' });
    }
  },
);

/**
 * PATCH /api/folders/:folderId
 * Query param: projectId (required)
 * Body: { name?, description? }
 * Updates an existing folder.
 */
router.patch(
  '/:folderId',
  authenticate,
  requireProjectAccess('EDITOR'),
  async (req: Request, res: Response) => {
    const { folderId } = req.params;
    const projectId = (req.query.projectId ?? req.body.projectId) as string;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Missing projectId' });
    }

    const parsed = updateFolderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }

    try {
      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (parsed.data.name) updates.name = parsed.data.name;
      if (parsed.data.description !== undefined) updates.description = parsed.data.description;

      await FolderEntity.patch({ projectId, folderId }).set(updates).go();
      res.json({ success: true });
    } catch (error) {
      console.error('Update Folder Error:', error);
      res.status(500).json({ success: false, error: 'Failed to update folder' });
    }
  },
);

/**
 * DELETE /api/folders/:folderId
 * Query param: projectId (required)
 * Deletes a folder.
 */
router.delete(
  '/:folderId',
  authenticate,
  requireProjectAccess('EDITOR'),
  async (req: Request, res: Response) => {
    const { folderId } = req.params;
    const projectId = (req.query.projectId ?? req.body.projectId) as string;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Missing projectId' });
    }

    try {
      await FolderEntity.delete({ projectId, folderId }).go();
      res.json({ success: true, message: 'Folder deleted' });
    } catch (error) {
      console.error('Delete Folder Error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete folder' });
    }
  },
);

export default router;
