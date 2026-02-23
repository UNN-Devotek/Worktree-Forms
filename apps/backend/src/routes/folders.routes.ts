import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

const router = Router();

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.union([z.string(), z.number()]).optional().nullable(),
});

// ==========================================
// FOLDER ENDPOINTS
// ==========================================

// Get folders
router.get('/', async (req: Request, res: Response) => {
  try {
    const folders = await prisma.folder.findMany({
        orderBy: { createdAt: 'desc' }
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
    const { name, parentId } = parsed.data;
    try {
        const folder = await prisma.folder.create({
            data: {
                name,
                parentId: parentId ? parseInt(parentId) : null
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
