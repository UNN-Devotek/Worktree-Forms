import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';
import { parsePaginationParam } from '../utils/query.js';
import { extractColumnsFromSchema, mapFieldTypeToColumnType } from '../utils/form-schema.js';
import { SheetIntegrationService } from '../services/sheet-integration.service.js';
import crypto from 'crypto';

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
        const take = parsePaginationParam(req.query.take, 50, 200);
        const skip = parsePaginationParam(req.query.skip, 0, 100000);
        const where = {
            OR: [
                { createdById: userId },
                { members: { some: { userId } } }
            ]
        };
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
        select: { id: true, header: true },
      });
      if (lockedColumns.length > 0 && userRole !== 'ADMIN' && userRole !== 'OWNER') {
        const names = lockedColumns.map((c) => c.header).join(', ');
        return res.status(403).json({
          success: false,
          error: `Column(s) locked: ${names}`,
        });
      }
    }

    const existing = await prisma.sheetRow.findUnique({ where: { id: rowId }, select: { data: true } });
    if (!existing) return res.status(404).json({ success: false, error: 'Row not found' });

    const row = await prisma.sheetRow.update({
      where: { id: rowId },
      data: { data: { ...(existing.data as object ?? {}), ...cellUpdates } },
    });

    res.json({ success: true, data: row });
  } catch (error) {
    console.error('SheetRow update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update row' });
  }
});

// Get project members (for assignee picker)
router.get('/:projectId/members', async (req: Request, res: Response) => {
    const { projectId } = req.params;
    try {
        const members = await prisma.projectMember.findMany({
            where: { projectId },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
        res.json({ success: true, data: members.map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email, roles: m.roles })) });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch members' });
    }
});

// Get project sheets list (for mention picker)
router.get('/:projectId/sheets-list', async (req: Request, res: Response) => {
    const { projectId } = req.params;
    try {
        const sheets = await prisma.sheet.findMany({
            where: { projectId },
            select: { id: true, title: true },
            orderBy: { title: 'asc' },
        });
        res.json({ success: true, data: sheets });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch sheets' });
    }
});

// ==========================================
// PROJECT-FORM ENDPOINTS
// ==========================================

const createProjectFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  form_json: z.record(z.unknown()).optional(),
  folderId: z.union([z.string(), z.number()]).optional().nullable(),
});

/** Helper: verify caller is a member of the project (or system ADMIN) */
async function verifyProjectMember(projectId: string, userId: string, systemRole?: string): Promise<boolean> {
  if (systemRole === 'ADMIN') return true;
  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId },
    select: { id: true },
  });
  return !!member;
}

// GET /api/projects/:projectId/forms
router.get('/:projectId/forms', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as any).user.id;
  const systemRole = (req as any).user?.systemRole;

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const forms = await prisma.form.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, data: { forms } });
  } catch (error) {
    console.error('Fetch Project Forms Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch forms' });
  }
});

// POST /api/projects/:projectId/forms — creates form + linked Sheet in one transaction
router.post('/:projectId/forms', auditMiddleware('form.create'), async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as any).user.id;
  const systemRole = (req as any).user?.systemRole;

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const parsed = createProjectFormSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { title, form_json, folderId } = parsed.data;
    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const columns = extractColumnsFromSchema(form_json ?? {});

    // Yjs column id = form field name so that row data (keyed by field name)
    // resolves correctly when the table renders cells via row[col.id].
    const yjsColumns = columns.map((col) => ({
      id: col.id,
      label: col.label,
      type: mapFieldTypeToColumnType(col.type),
    }));

    // Create initial Yjs document binary with columns pre-populated
    const initialContent = yjsColumns.length > 0
      ? SheetIntegrationService.createInitialYjsDoc(yjsColumns)
      : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sheet with Yjs content
      const sheet = await tx.sheet.create({
        data: { projectId, title, content: initialContent },
      });

      // 2. Create Sheet columns from form schema
      if (columns.length > 0) {
        await tx.sheetColumn.createMany({
          data: columns.map((col, i) => ({
            sheetId: sheet.id,
            header: col.label,
            type: mapFieldTypeToColumnType(col.type),
            order: i,
            options: { fieldName: col.id },
          })),
        });
      }

      // 3. Create Form linked to sheet
      const form = await tx.form.create({
        data: {
          group_id: 1, // Default group — forms belong to the project context
          slug,
          title,
          form_schema: form_json ?? {},
          is_published: false,
          is_active: true,
          projectId,
          targetSheetId: sheet.id,
          folderId: folderId ? parseInt(String(folderId)) : null,
        },
      });

      // 4. Create initial FormVersion
      await tx.formVersion.create({
        data: {
          form_id: form.id,
          version: 1,
          schema: form_json ?? {},
          changelog: 'Initial version',
          editorId: userId || null,
        },
      });

      return { form, sheet };
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Form and linked table created',
    });
  } catch (error: unknown) {
    console.error('Create Project Form Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create form',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /:projectId/forms/:formId/analytics
router.get('/:projectId/forms/:formId/analytics', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const formId = parseInt(req.params.formId);
  const userId = (req as any).user.id;
  const systemRole = (req as any).user?.systemRole;

  if (isNaN(formId)) return res.status(400).json({ success: false, error: 'Invalid form ID' });

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, recentSubmissions, statusGroups] = await Promise.all([
      prisma.submission.count({ where: { form_id: formId } }),
      prisma.submission.findMany({
        where: { form_id: formId, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.submission.groupBy({
        by: ['status'],
        where: { form_id: formId },
        _count: { _all: true },
      }),
    ]);

    const buckets: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const s of recentSubmissions) {
      const day = s.createdAt.toISOString().slice(0, 10);
      if (day in buckets) buckets[day]++;
    }
    const submissionsPerDay = Object.entries(buckets).map(([date, count]) => ({ date, count }));

    const statusBreakdown: Record<string, number> = {};
    for (const g of statusGroups) {
      statusBreakdown[g.status || 'unknown'] = g._count._all;
    }

    res.json({ success: true, data: { total, submissionsPerDay, statusBreakdown } });
  } catch (error) {
    console.error('Form Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// GET /:projectId/forms/:formId/submissions
router.get('/:projectId/forms/:formId/submissions', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const formId = parseInt(req.params.formId);
  const userId = (req as any).user.id;
  const systemRole = (req as any).user?.systemRole;

  if (isNaN(formId)) return res.status(400).json({ success: false, error: 'Invalid form ID' });

  const take = parsePaginationParam(req.query.take, 20, 100);
  const skip = parsePaginationParam(req.query.skip, 0, 100000);

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { form_id: formId },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.submission.count({ where: { form_id: formId } }),
    ]);
    res.json({ success: true, data: { submissions }, meta: { total, take, skip } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// POST /:projectId/forms/:formId/sync-columns — reset sheet columns to match current form schema
router.post('/:projectId/forms/:formId/sync-columns', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const formId = parseInt(req.params.formId);
  const userId = (req as any).user.id;
  const systemRole = (req as any).user?.systemRole;

  if (isNaN(formId)) return res.status(400).json({ success: false, error: 'Invalid form ID' });

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const form = await prisma.form.findFirst({
      where: { id: formId, projectId },
      select: { form_schema: true, targetSheetId: true },
    });
    if (!form) return res.status(404).json({ success: false, error: 'Form not found' });
    if (!form.targetSheetId) return res.status(400).json({ success: false, error: 'Form has no linked sheet' });

    const newColumns = extractColumnsFromSchema(form.form_schema);

    // Yjs column id = form field name so that row data (keyed by field name)
    // resolves correctly when the table renders cells via row[col.id].
    const yjsColumns = newColumns.map((col) => ({
      id: col.id,
      label: col.label,
      type: mapFieldTypeToColumnType(col.type),
    }));

    // 1. Update database columns
    await prisma.$transaction(async (tx) => {
      await tx.sheetColumn.deleteMany({ where: { sheetId: form.targetSheetId! } });
      if (yjsColumns.length > 0) {
        await tx.sheetColumn.createMany({
          data: yjsColumns.map((col, i) => ({
            sheetId: form.targetSheetId!,
            header: col.label,
            type: col.type,
            order: i,
            options: { fieldName: newColumns[i].id },
          })),
        });
      }
    });

    // 2. Sync columns into the Yjs document (so active clients see the update)
    try {
      const sheetService = new SheetIntegrationService();
      await sheetService.syncColumnsToYjs(form.targetSheetId!, yjsColumns);
    } catch (yjsErr) {
      console.warn('Yjs column sync failed (columns saved to DB):', yjsErr);
    }

    res.json({ success: true, message: `Synced ${yjsColumns.length} columns from form schema`, data: { columnCount: yjsColumns.length } });
  } catch (error) {
    console.error('Sync Columns Error:', error);
    res.status(500).json({ success: false, error: 'Failed to sync sheet columns' });
  }
});

export default router;
