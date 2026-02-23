import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });


// ==========================================
// PROJECT ENDPOINTS
// ==========================================

// Get all projects
router.get('/', async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
        const take = Math.min(parseInt(req.query.take as string) || 50, 200);
        const skip = parseInt(req.query.skip as string) || 0;
        const where = {
            OR: [
                { createdById: userId },
                { members: { some: { userId } } }
            ]
        } as const;
        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                take,
                skip,
                orderBy: { updatedAt: 'desc' },
                include: {
                    _count: {
                        select: { forms: true, members: true }
                    }
                }
            }),
            prisma.project.count({ where })
        ]);
        res.json({ success: true, data: projects, meta: { total, take, skip } });
    } catch (error) {
        console.error('Fetch Projects Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
});

// My Daily Route (Field Ops)
router.get('/:id/routes/my-daily', async (req: Request, res: Response) => {
     const { id } = req.params; // project ID or slug
     const { userId } = req.query; // temporary, should use auth middleware
     
     try {
         // Mock response for now, or minimal DB query
         // In real app: Find Project -> Find Schedule -> Find Stops for Today -> Filter by User
         
         const todayStr = new Date().toISOString();
         
         const route = {
             id: 101,
             date: todayStr,
             status: 'active',
             stops: [
                 { 
                     id: 1, 
                     title: 'Foundation Check', 
                     address: '123 Main St, Reno, NV', 
                     status: 'pending', 
                     priority: 'high', 
                     order: 1,
                     latitude: 39.5296,
                     longitude: -119.8138,
                     scheduledAt: new Date().toISOString(),
                     form: { id: 1, title: 'Safety Inspection' }
                 },
                 { 
                     id: 2, 
                     title: 'Wiring Validation', 
                     address: '456 Elm St, Sparks, NV', 
                     status: 'pending', 
                     priority: 'normal', 
                     order: 2,
                     latitude: 39.5345,
                     longitude: -119.7500
                 }
             ]
         };

         res.json({ success: true, data: { route } });
     } catch (error) {
         console.error('Daily Route Error:', error);
         res.status(500).json({ success: false, error: 'Failed to fetch daily route' });
     }
});

// Get single project
router.get('/:idOrSlug', async (req: Request, res: Response) => {
    const { idOrSlug } = req.params;
    try {
        // Try ID first, then Slug
        let project = await prisma.project.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ]
            },
            include: {
                _count: {
                    select: { forms: true, members: true }
                }
            }
        });
        
        if (!project) {
             return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch project' });
    }
});

// Create project
router.post('/', auditMiddleware('project.create'), async (req: Request, res: Response) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { name, description } = parsed.data;
    const userId = (req as any).user.id;

    try {
        // Generate slug with base36 timestamp + random suffix to avoid collisions
        const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const slug = `${slugBase}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        
        const project = await prisma.project.create({
            data: {
                name,
                description,
                slug,
                createdById: userId 
            }
        });
        res.status(201).json({ success: true, data: project });
    } catch (error: unknown) {
        console.error('Create Project Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Generic Project Upload (for RFI photos, etc)
router.post('/:projectId/upload', upload.single('file'), async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    try {
        const fileRecord = await UploadService.uploadFile(req.file, `projects/${projectId}/uploads`, userId);
        const url = UploadService.getFileUrl(fileRecord.objectKey);
        
        res.json({
            success: true,
            data: {
                ...fileRecord,
                url
            }
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});


// ==========================================
// SHEET ROW ENDPOINTS
// ==========================================

// PATCH /api/projects/:id/sheets/:sheetId/rows/:rowId
// Update cell data for a row, enforcing column-level lock permissions.
router.patch('/:id/sheets/:sheetId/rows/:rowId', async (req: Request, res: Response) => {
  const userRole = (req as any).user?.systemRole ?? 'MEMBER';
  const { sheetId, rowId } = req.params;
  const cellUpdates: Record<string, unknown> = req.body.data ?? {};

  try {
    // Check if any updated columns are locked
    const updatedColumnIds = Object.keys(cellUpdates);
    if (updatedColumnIds.length > 0) {
      const lockedColumns = await prisma.sheetColumn.findMany({
        where: { id: { in: updatedColumnIds }, sheetId, locked: true },
        select: { id: true, name: true },
      });
      if (lockedColumns.length > 0 && userRole !== 'ADMIN' && userRole !== 'OWNER') {
        const names = lockedColumns.map((c) => c.name).join(', ');
        return res.status(403).json({
          success: false,
          error: `Column(s) locked: ${names}`,
        });
      }
    }

    const row = await prisma.sheetRow.update({
      where: { id: rowId },
      data: { data: { ...(await prisma.sheetRow.findUnique({ where: { id: rowId }, select: { data: true } }))?.data as object ?? {}, ...cellUpdates } },
    });

    res.json({ success: true, data: row });
  } catch (error) {
    console.error('SheetRow update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update row' });
  }
});

export default router;
