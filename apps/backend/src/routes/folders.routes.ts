import { Router, Request, Response } from 'express';
import { z } from 'zod';
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
// Note: Folders are not stored in DynamoDB (no FolderEntity).
// Folder organization is handled client-side or via form metadata.
// These endpoints return empty data to maintain API compatibility.

router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    // Folders are not persisted in DynamoDB; return empty list
    res.json({ success: true, data: { folders: [] } });
  } catch (error) {
    console.error('Fetch Folders Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch folders' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = createFolderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
  }
  // Stub: folders not persisted in DynamoDB
  const { name, parentId, projectId } = parsed.data;
  const folder = {
    id: Date.now().toString(),
    name,
    parentId: parentId ?? null,
    projectId: projectId ?? null,
    createdAt: new Date().toISOString(),
  };
  res.json({ success: true, data: { folder } });
});

router.put('/:id', async (req: Request, res: Response) => {
  // Stub: folders not persisted in DynamoDB
  res.json({ success: true, data: { folder: { id: req.params.id, ...req.body } } });
});

router.delete('/:id', async (req: Request, res: Response) => {
  // Stub: folders not persisted in DynamoDB
  res.json({ success: true, message: 'Folder deleted' });
});

export default router;
