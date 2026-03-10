import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { z } from 'zod';
import {
  ProjectEntity,
  ProjectMemberEntity,
  FormEntity,
  FormVersionEntity,
  SubmissionEntity,
  SheetEntity,
  SheetColumnEntity,
  SheetRowEntity,
  UserEntity,
} from '../lib/dynamo/index.js';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';
import { extractColumnsFromSchema, mapFieldTypeToColumnType } from '../utils/form-schema.js';
import { SheetIntegrationService } from '../services/sheet-integration.service.js';
import { nanoid } from 'nanoid';
import { deletionLimiter } from '../middleware/rateLimiter.js';

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
  const userId = (req as AuthenticatedRequest).user.id;
  try {
    // Get projects where user is a member
    const memberResult = await ProjectMemberEntity.query.byUser({ userId }).go();
    const projectIds = memberResult.data.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return res.json({ success: true, data: [], meta: { total: 0 } });
    }

    // Fetch all projects in parallel
    const projectResults = await Promise.all(projectIds.map((projectId) => ProjectEntity.get({ projectId }).go()));
    const projects = projectResults.map((r) => r.data).filter(Boolean);

    res.json({ success: true, data: projects, meta: { total: projects.length } });
  } catch (error) {
    console.error('Fetch Projects Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:idOrSlug', async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;
  try {
    // Try ID first
    let projectResult = await ProjectEntity.get({ projectId: idOrSlug }).go();
    let project = projectResult.data;

    if (!project) {
      // Try slug
      const slugResult = await ProjectEntity.query.bySlug({ slug: idOrSlug }).go();
      project = slugResult.data[0] ?? null;
    }

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const isMember = await verifyProjectMember(project.projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

// Create project (rate limited to prevent resource flooding)
router.post('/', deletionLimiter, auditMiddleware('project.create'), async (req: Request, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { name, description } = parsed.data;
  const userId = (req as AuthenticatedRequest).user.id;

  try {
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const projectId = nanoid();

    const result = await ProjectEntity.create({
      projectId,
      name,
      description,
      slug,
      ownerId: userId,
    }).go();

    // Add creator as OWNER member
    await ProjectMemberEntity.create({
      projectId,
      userId,
      roles: ['OWNER'],
    }).go();

    res.status(201).json({ success: true, data: result.data });
  } catch (error: unknown) {
    console.error('Create Project Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Generic Project Upload
router.post('/:projectId/upload', upload.single('file'), async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;

  const isMember = await verifyProjectMember(projectId, userId, systemRole);
  if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    const fileRecord = await UploadService.uploadFile(req.file, `projects/${projectId}/uploads`, userId, projectId);
    const url = UploadService.getFileUrl(fileRecord.objectKey);
    res.json({ success: true, data: { ...fileRecord, url } });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// ==========================================
// SHEET ROW ENDPOINTS
// ==========================================

// PATCH /api/projects/:id/sheets/:sheetId/rows/:rowId
router.patch('/:id/sheets/:sheetId/rows/:rowId', async (req: Request, res: Response) => {
  const userRole = (req as AuthenticatedRequest).user?.systemRole ?? 'MEMBER';
  const { id: projectId, sheetId, rowId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const cellUpdates: Record<string, unknown> = req.body.data ?? {};

  const isMember = await verifyProjectMember(projectId, userId, userRole);
  if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

  try {
    // Check if any updated columns are locked
    const updatedColumnIds = Object.keys(cellUpdates);
    if (updatedColumnIds.length > 0) {
      const colResult = await SheetColumnEntity.query.primary({ sheetId }).go();
      const lockedColumns = colResult.data.filter(
        (c) => updatedColumnIds.includes(c.columnId) && (c.config as Record<string, unknown>)?.locked === true,
      );
      if (lockedColumns.length > 0 && userRole !== 'ADMIN' && userRole !== 'OWNER') {
        const names = lockedColumns.map((c) => c.name).join(', ');
        return res.status(403).json({ success: false, error: `Column(s) locked: ${names}` });
      }
    }

    const existing = await SheetRowEntity.get({ sheetId, rowId }).go();
    if (!existing.data) return res.status(404).json({ success: false, error: 'Row not found' });

    const mergedData = { ...((existing.data.data as object) ?? {}), ...cellUpdates };
    await SheetRowEntity.patch({ sheetId, rowId })
      .set({ data: mergedData, updatedAt: new Date().toISOString() })
      .go();

    const updated = await SheetRowEntity.get({ sheetId, rowId }).go();
    res.json({ success: true, data: updated.data });
  } catch (error) {
    console.error('SheetRow update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update row' });
  }
});

// Get project members
router.get('/:projectId/members', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;
  const isMember = await verifyProjectMember(projectId, userId, systemRole);
  if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });
  try {
    const memberResult = await ProjectMemberEntity.query.primary({ projectId }).go();
    const userResults = await Promise.all(memberResult.data.map((m) => UserEntity.get({ userId: m.userId }).go()));
    const members = memberResult.data
      .map((m, i) => {
        const u = userResults[i].data;
        if (!u) return null;
        return { id: u.userId, name: u.name, email: u.email, roles: m.roles };
      })
      .filter(Boolean);
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch members' });
  }
});

// Get project sheets list
router.get('/:projectId/sheets-list', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;
  const isMember = await verifyProjectMember(projectId, userId, systemRole);
  if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });
  try {
    const result = await SheetEntity.query.byProject({ projectId }).go();
    const sheets = result.data.map((s) => ({ id: s.sheetId, title: s.name }));
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
  const result = await ProjectMemberEntity.get({ projectId, userId }).go();
  return !!result.data;
}

// GET /api/projects/:projectId/forms
router.get('/:projectId/forms', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const result = await FormEntity.query.byProject({ projectId }).go();
    res.json({ success: true, data: { forms: result.data } });
  } catch (error) {
    console.error('Fetch Project Forms Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch forms' });
  }
});

// POST /api/projects/:projectId/forms
router.post('/:projectId/forms', auditMiddleware('form.create'), async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const parsed = createProjectFormSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { title, form_json } = parsed.data;
    const columns = extractColumnsFromSchema(form_json ?? {});
    const yjsColumns = columns.map((col) => ({
      id: col.id,
      label: col.label,
      type: mapFieldTypeToColumnType(col.type),
    }));

    const initialContent = yjsColumns.length > 0
      ? SheetIntegrationService.createInitialYjsDoc(yjsColumns)
      : null;

    // 1. Create Sheet
    const sheetId = nanoid();
    await SheetEntity.create({
      sheetId,
      projectId,
      name: title,
    }).go();

    // 2. Create Sheet columns
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      await SheetColumnEntity.create({
        columnId: nanoid(),
        sheetId,
        name: col.label,
        type: mapFieldTypeToColumnType(col.type),
        order: i,
        config: { fieldName: col.id },
      }).go();
    }

    // 3. Create Form
    const formId = nanoid();
    const formResult = await FormEntity.create({
      formId,
      projectId,
      name: title,
      schema: form_json ?? {},
      status: 'DRAFT',
      targetSheetId: sheetId,
      createdBy: userId,
    }).go();

    // 4. Create initial FormVersion
    await FormVersionEntity.create({
      formId,
      projectId,
      version: 1,
      schema: form_json ?? {},
      changelog: 'Initial version',
      createdBy: userId,
    }).go();

    // ElectroDB create().go() may return null data; merge in the known formId so the
    // client can redirect immediately without a secondary fetch.
    res.status(201).json({
      success: true,
      data: { form: { ...(formResult.data ?? {}), formId }, sheet: { sheetId } },
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

// PUT /api/projects/:projectId/forms/:formId
router.put('/:projectId/forms/:formId', auditMiddleware('form.update'), async (req: Request, res: Response) => {
  const { projectId, formId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const { title, name, form_json, schema, status, is_published, folderId } = req.body;
    const resolvedName = name ?? title;
    const resolvedSchema = schema ?? form_json;
    const resolvedStatus = status ?? (is_published === true ? 'PUBLISHED' : is_published === false ? 'DRAFT' : undefined);

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (resolvedName) updates.name = resolvedName;
    if (resolvedSchema) updates.schema = resolvedSchema;
    if (resolvedStatus) updates.status = resolvedStatus;
    if (folderId !== undefined) updates.folderId = folderId ?? null;
    // Persist targetSheetId as top-level attribute if present in schema settings
    const schemaTargetSheetId = (resolvedSchema as any)?.settings?.targetSheetId;
    if (schemaTargetSheetId && schemaTargetSheetId !== 'none') updates.targetSheetId = schemaTargetSheetId;

    const result = await FormEntity.patch({ projectId, formId }).set(updates).go();
    res.json({ success: true, data: { form: result.data } });
  } catch (error) {
    console.error('Update Project Form Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update form' });
  }
});

// DELETE /api/projects/:projectId/forms/:formId
router.delete('/:projectId/forms/:formId', auditMiddleware('form.delete'), async (req: Request, res: Response) => {
  const { projectId, formId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    await FormEntity.delete({ projectId, formId }).go();
    res.json({ success: true, message: 'Form deleted' });
  } catch (error) {
    console.error('Delete Project Form Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete form' });
  }
});

const BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.dll', '.so', '.bin'];
const BLOCKED_MIMETYPES = ['application/x-executable', 'application/x-msdownload', 'application/x-sh'];

// POST /api/projects/:projectId/forms/:formId/upload
router.post('/:projectId/forms/:formId/upload', upload.array('file', 10), async (req: Request, res: Response) => {
  const { projectId, formId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    for (const file of files) {
      const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase();
      if (BLOCKED_EXTENSIONS.includes(ext) || BLOCKED_MIMETYPES.includes(file.mimetype)) {
        return res.status(400).json({ success: false, error: `File type not allowed: ${file.originalname}` });
      }
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const folder = `projects/${projectId}/forms/${formId}`;
        const record = await UploadService.uploadFile(file, folder, userId, projectId);
        return {
          filename: record.originalName,
          object_key: record.objectKey,
          url: UploadService.getFileUrl(record.objectKey),
          size: record.sizeBytes,
          content_type: record.mimeType,
        };
      })
    );

    res.json({ success: true, data: { files: uploaded } });
  } catch (error) {
    console.error('Form Upload Error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// GET /:projectId/forms/:formId/analytics
router.get('/:projectId/forms/:formId/analytics', async (req: Request, res: Response) => {
  const { projectId, formId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const result = await SubmissionEntity.query.byForm({ formId }).go();
    const submissions = result.data;
    const total = submissions.length;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubmissions = submissions.filter(
      (s) => new Date(s.createdAt ?? 0) >= thirtyDaysAgo,
    );

    const buckets: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const s of recentSubmissions) {
      const day = new Date(s.createdAt ?? 0).toISOString().slice(0, 10);
      if (day in buckets) buckets[day]++;
    }
    const submissionsPerDay = Object.entries(buckets).map(([date, count]) => ({ date, count }));

    const statusBreakdown: Record<string, number> = {};
    for (const s of submissions) {
      const status = s.status || 'unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    }

    res.json({ success: true, data: { total, submissionsPerDay, statusBreakdown } });
  } catch (error) {
    console.error('Form Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// GET /:projectId/forms/:formId/submissions
router.get('/:projectId/forms/:formId/submissions', async (req: Request, res: Response) => {
  const { projectId, formId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const result = await SubmissionEntity.query.byForm({ formId }).go({ limit });
    const submissions = result.data;
    res.json({ success: true, data: { submissions }, meta: { total: submissions.length, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// POST /:projectId/forms/:formId/sync-columns
router.post('/:projectId/forms/:formId/sync-columns', async (req: Request, res: Response) => {
  const { projectId, formId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const systemRole = (req as AuthenticatedRequest).user?.systemRole;

  try {
    const isMember = await verifyProjectMember(projectId, userId, systemRole);
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });

    const formResult = await FormEntity.get({ projectId, formId }).go();
    if (!formResult.data) return res.status(404).json({ success: false, error: 'Form not found' });

    // Note: In the DynamoDB model, form does not directly store targetSheetId.
    // For now we assume the sheetId matches a convention or is passed as a query param.
    const sheetId = req.query.sheetId as string;
    if (!sheetId) return res.status(400).json({ success: false, error: 'sheetId query parameter required' });

    const newColumns = extractColumnsFromSchema(formResult.data.schema);
    const yjsColumns = newColumns.map((col) => ({
      id: col.id,
      label: col.label,
      type: mapFieldTypeToColumnType(col.type),
    }));

    // Delete existing columns in parallel
    const existingCols = await SheetColumnEntity.query.primary({ sheetId }).go();
    await Promise.all(existingCols.data.map((col) => SheetColumnEntity.delete({ sheetId, columnId: col.columnId }).go()));

    // Create new columns in parallel
    await Promise.all(yjsColumns.map((col, i) =>
      SheetColumnEntity.create({
        columnId: nanoid(),
        sheetId,
        name: col.label,
        type: col.type,
        order: i,
        config: { fieldName: newColumns[i].id },
      }).go()
    ));

    // Sync Yjs
    try {
      const sheetService = new SheetIntegrationService();
      await sheetService.syncColumnsToYjs(sheetId, yjsColumns);
    } catch (yjsErr) {
      console.warn('Yjs column sync failed (columns saved to DB):', yjsErr);
    }

    res.json({
      success: true,
      message: `Synced ${yjsColumns.length} columns from form schema`,
      data: { columnCount: yjsColumns.length },
    });
  } catch (error) {
    console.error('Sync Columns Error:', error);
    res.status(500).json({ success: false, error: 'Failed to sync sheet columns' });
  }
});

export default router;
