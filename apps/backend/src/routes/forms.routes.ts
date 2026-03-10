import { Router, Request, Response } from 'express';
import { Readable } from 'stream';
import { z } from 'zod';
import {
  FormEntity,
  FormVersionEntity,
  SubmissionEntity,
  ProjectEntity,
  ProjectMemberEntity,
  SheetColumnEntity,
  SheetRowEntity,
  FileUploadEntity,
} from '../lib/dynamo/index.js';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';
import { generateFlattenedPDF } from '../services/pdf-export.service.js';
import { MigrationService } from '../services/migration-service.js';
import { rateLimitTiers } from '../middleware/rateLimiter.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';
import { StorageService } from '../storage.js';
import archiver from 'archiver';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../storage.js';
import { extractColumnsFromSchema, mapFieldTypeToColumnType } from '../utils/form-schema.js';
import { nanoid } from 'nanoid';

const createFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  form_type: z.string().optional(),
  form_json: z.record(z.unknown()).optional(),
  is_published: z.boolean().optional(),
  is_active: z.boolean().optional(),
  folderId: z.union([z.string(), z.number()]).optional().nullable(),
  groupSlug: z.string().optional(),
  userId: z.string().optional().nullable(),
  projectId: z.string().optional(),
});

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ==========================================
// FORM ENDPOINTS
// ==========================================

// Get all forms (or single form by slug when ?slug= is provided)
router.get('/forms', async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user.id;
  const isAdmin = (req as AuthenticatedRequest).user?.systemRole === 'ADMIN';

  try {
    const slug = req.query.slug as string | undefined;
    const projectId = req.query.projectId as string | undefined;

    if (slug && projectId) {
      const memberResult = await ProjectMemberEntity.get({ projectId, userId }).go();
      if (!memberResult.data && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const result = await FormEntity.query.byProject({ projectId }).go();
      const form = result.data.find((f) => f.formId === slug || f.name === slug);
      if (!form) return res.status(404).json({ success: false, error: 'Form not found' });
      return res.json({ success: true, data: form });
    }

    if (projectId) {
      const memberResult = await ProjectMemberEntity.get({ projectId, userId }).go();
      if (!memberResult.data && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const result = await FormEntity.query.byProject({ projectId }).go();
      return res.json({ success: true, data: result.data, meta: { total: result.data.length } });
    }

    // Without projectId: admins see all forms; regular users see forms from their projects.
    if (isAdmin) {
      const result = await FormEntity.scan.go();
      return res.json({ success: true, data: result.data, meta: { total: result.data.length } });
    }

    const memberships = await ProjectMemberEntity.query.byUser({ userId }).go();
    const projectIds = memberships.data.map((m) => m.projectId);
    const allForms = await Promise.all(
      projectIds.map((pid) => FormEntity.query.byProject({ projectId: pid }).go())
    );
    const forms = allForms.flatMap((r) => r.data);
    res.json({ success: true, data: forms, meta: { total: forms.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch forms' });
  }
});

// @deprecated Use /api/projects/:projectId/forms instead. Kept for backward compatibility.
// Get all forms for a group (legacy endpoint, maps to project)
router.get('/groups/:groupId/forms', async (req: Request, res: Response) => {
  const projectId = req.params.groupId;
  try {
    const result = await FormEntity.query.byProject({ projectId }).go();
    res.json({ success: true, data: { forms: result.data }, meta: { total: result.data.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch forms' });
  }
});

// @deprecated Use /api/projects/:projectId/forms instead. Kept for backward compatibility.
// Get specific form
router.get('/groups/:groupId/forms/:formId', async (req: Request, res: Response) => {
  const projectId = req.params.groupId;
  const formId = req.params.formId;

  try {
    const formResult = await FormEntity.get({ projectId, formId }).go();
    const form = formResult.data;

    if (!form) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }

    // Verify access
    const userId = (req as AuthenticatedRequest).user.id;
    const memberResult = await ProjectMemberEntity.get({ projectId, userId }).go();
    const isAdmin = (req as AuthenticatedRequest).user?.systemRole === 'ADMIN';
    if (!memberResult.data && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get latest version
    const versionsResult = await FormVersionEntity.query.byForm({ formId }).go();
    const latestVersion = versionsResult.data.sort((a, b) => b.version - a.version)[0];

    res.json({
      success: true,
      data: {
        form,
        latestVersionId: latestVersion ? `${latestVersion.formId}#${latestVersion.version}` : undefined,
        version: latestVersion?.version,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching form' });
  }
});

// @deprecated Use /api/projects/:projectId/forms instead. Kept for backward compatibility.
// Create new form
router.post('/groups/:groupId/forms', auditMiddleware('form.create'), async (req: Request, res: Response) => {
  const projectId = req.params.groupId;

  const parsed = createFormSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { title, form_json } = parsed.data;
  const userId = (req as AuthenticatedRequest).user.id;

  try {
    const formId = nanoid();
    const formResult = await FormEntity.create({
      formId,
      projectId,
      name: title,
      schema: form_json ?? {},
      status: 'DRAFT',
      createdBy: userId,
    }).go();

    await FormVersionEntity.create({
      formId,
      projectId,
      version: 1,
      schema: form_json ?? {},
      changelog: 'Initial version',
      createdBy: userId,
    }).go();

    res.status(201).json({
      success: true,
      data: { form: formResult.data },
      message: 'Form created successfully',
    });
  } catch (error: unknown) {
    console.error('Create Form Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create form',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// @deprecated Use /api/projects/:projectId/forms instead. Kept for backward compatibility.
// Update form
router.put('/groups/:groupId/forms/:formId', authenticate, async (req: Request, res: Response) => {
  const projectId = req.params.groupId;
  const formId = req.params.formId;
  const updates = req.body;
  const userId = (req as AuthenticatedRequest).user.id;

  try {
    const formResult = await FormEntity.get({ projectId, formId }).go();
    if (!formResult.data) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }
    const existingForm = formResult.data;

    // Check membership
    const isAdmin = (req as AuthenticatedRequest).user?.systemRole === 'ADMIN';
    if (!isAdmin) {
      const memberResult = await ProjectMemberEntity.get({ projectId, userId }).go();
      if (!memberResult.data) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }

    // Check for schema changes and create version
    if (updates.form_json) {
      if (JSON.stringify(existingForm.schema) !== JSON.stringify(updates.form_json)) {

        const renames = MigrationService.detectRenames(existingForm.schema, updates.form_json);
        if (Object.keys(renames).length > 0) {
          try {
            await MigrationService.migrateSubmissions(formId, projectId, renames);
          } catch (err) {
            console.error('Migration failed:', err);
            return res.status(500).json({ success: false, error: 'Schema migration failed' });
          }
        }

        const versionsResult = await FormVersionEntity.query.byForm({ formId }).go();
        const versions = versionsResult.data.sort((a, b) => b.version - a.version);
        let nextVersion = 1;

        if (versions.length > 0) {
          nextVersion = versions[0].version + 1;
        } else {
          // Backfill v1
          await FormVersionEntity.create({
            formId,
            projectId,
            version: 1,
            schema: existingForm.schema ?? {},
            changelog: 'Legacy version backfill',
          }).go();
          nextVersion = 2;
        }

        await FormVersionEntity.create({
          formId,
          projectId,
          version: nextVersion,
          schema: updates.form_json,
          changelog: 'Updated via Form Builder',
          createdBy: userId,
        }).go();
      }
    }

    // Update form fields
    const setData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (updates.title) setData.name = updates.title;
    if (updates.description) setData.description = updates.description;
    if (updates.form_json) setData.schema = updates.form_json;
    if (updates.is_published !== undefined) setData.status = updates.is_published ? 'PUBLISHED' : 'DRAFT';
    // Persist targetSheetId as top-level attribute if present in schema settings
    const schemaTargetSheetId = (updates.form_json as any)?.settings?.targetSheetId;
    if (schemaTargetSheetId && schemaTargetSheetId !== 'none') setData.targetSheetId = schemaTargetSheetId;

    await FormEntity.patch({ projectId, formId }).set(setData).go();
    const updatedFormResult = await FormEntity.get({ projectId, formId }).go();

    res.json({
      success: true,
      data: { form: updatedFormResult.data },
      message: 'Form updated successfully',
    });
  } catch (error: unknown) {
    console.error('Update Form Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update form',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get Form Versions
router.get('/groups/:groupId/forms/:formId/versions', async (req: Request, res: Response) => {
  const formId = req.params.formId;
  try {
    const result = await FormVersionEntity.query.byForm({ formId }).go();
    const versions = result.data.sort((a, b) => b.version - a.version);
    res.json({ success: true, data: { versions } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch versions' });
  }
});

// Restore Version
router.post('/groups/:groupId/forms/:formId/versions/:versionNumber/restore', authenticate, async (req: Request, res: Response) => {
  const { groupId: projectId, formId, versionNumber } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;
  const targetVersionNum = parseInt(versionNumber);

  try {
    const versionsResult = await FormVersionEntity.query.byForm({ formId }).go();
    const targetVersion = versionsResult.data.find((v) => v.version === targetVersionNum);

    if (!targetVersion) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    const versions = versionsResult.data.sort((a, b) => b.version - a.version);
    const nextVersion = (versions[0]?.version || 0) + 1;

    await FormVersionEntity.create({
      formId,
      projectId,
      version: nextVersion,
      schema: targetVersion.schema ?? {},
      changelog: `Restored from v${targetVersion.version}`,
      createdBy: userId || undefined,
    }).go();

    await FormEntity.patch({ projectId, formId })
      .set({ schema: targetVersion.schema ?? {}, updatedAt: new Date().toISOString() })
      .go();

    const updatedForm = await FormEntity.get({ projectId, formId }).go();

    res.json({
      success: true,
      data: { version: nextVersion, form: updatedForm.data },
      message: `Restored to version ${targetVersion.version}`,
    });
  } catch (error) {
    console.error('Restore Error:', error);
    res.status(500).json({ success: false, error: 'Failed to restore version' });
  }
});

// Generate Presigned Upload URL
router.post('/groups/:groupId/forms/:formId/upload/presign', async (req: Request, res: Response) => {
  const { filename, contentType } = req.body;
  const key = `uploads/${Date.now()}-${filename}`;

  try {
    const uploadUrl = await StorageService.getUploadUrl(key, contentType);
    const finalUrl = await StorageService.getDownloadUrl(key);
    res.json({ success: true, data: { uploadUrl, key, url: finalUrl } });
  } catch (error) {
    console.error('Storage Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate upload URL' });
  }
});

// Upload File (Direct)
router.post(
  '/groups/:groupId/forms/:formId/upload',
  rateLimitTiers.upload,
  upload.single('file'),
  async (req: Request, res: Response) => {
    const projectId = req.params.groupId;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    try {
      const fileRecord = await UploadService.uploadFile(
        req.file,
        'form_uploads',
        (req as AuthenticatedRequest).user?.id,
        projectId,
      );
      const displayUrl = UploadService.getFileUrl(fileRecord.objectKey);

      res.json({
        success: true,
        data: {
          files: [
            {
              id: fileRecord.fileId,
              filename: fileRecord.originalName,
              object_key: fileRecord.objectKey,
              url: displayUrl,
              size: fileRecord.sizeBytes,
              content_type: fileRecord.mimeType,
            },
          ],
        },
      });
    } catch (error) {
      console.error('Upload Error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);

interface AttachedFileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  timestamp: number;
}

interface EncodedField {
  cellValue: unknown;
  attachedFiles: AttachedFileRecord[];
}

/**
 * Encode a form field value based on the form's attachmentMode.
 * - embed_cells: images → __img__ (single) or __carousel__ (multiple)
 * - attach_row:  images → returned as attachedFiles (stored in row _files_)
 * - both:        images → encoded for cells AND returned as attachedFiles
 */
function encodeFormValueForSheet(
  value: unknown,
  attachmentMode: 'embed_cells' | 'attach_row' | 'both' = 'embed_cells',
  uploadedBy = 'form',
): EncodedField {
  if (!Array.isArray(value) || value.length === 0) {
    return { cellValue: value, attachedFiles: [] };
  }

  const images = (value as Record<string, unknown>[]).filter(
    (item) =>
      typeof item?.url === 'string' &&
      typeof item?.content_type === 'string' &&
      (item.content_type as string).startsWith('image/'),
  );

  if (images.length === 0) {
    return { cellValue: value, attachedFiles: [] };
  }

  const attachedFiles: AttachedFileRecord[] = (attachmentMode === 'attach_row' || attachmentMode === 'both')
    ? images.map((img) => ({
        id: nanoid(),
        name: String(img.filename ?? img.url ?? 'image'),
        size: typeof img.size === 'number' ? img.size : 0,
        type: String(img.content_type ?? 'image/*'),
        url: String(img.url),
        uploadedBy,
        timestamp: Date.now(),
      }))
    : [];

  let cellValue: unknown = value;
  if (attachmentMode === 'embed_cells' || attachmentMode === 'both') {
    if (images.length === 1) {
      cellValue = `__img__${JSON.stringify({ url: images[0].url, width: 200, height: 150 })}`;
    } else {
      const imgArray = images.map((img) => ({ url: img.url, width: 200, height: 150 }));
      cellValue = `__carousel__${JSON.stringify(imgArray)}`;
    }
  }

  return { cellValue, attachedFiles };
}

// Create Submission
router.post('/groups/:groupId/forms/:formId/submit', async (req: Request, res: Response) => {
  const projectId = req.params.groupId;
  const formId = req.params.formId;
  const data = req.body;

  try {
    const formResult = await FormEntity.get({ projectId, formId }).go();
    if (!formResult.data) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }

    const submissionData = data.response_data ?? data;

    const submissionId = nanoid();
    const result = await SubmissionEntity.create({
      submissionId,
      formId,
      projectId,
      data: submissionData,
      status: 'PENDING',
    }).go();

    // Write to linked sheet if form has targetSheetId
    const targetSheetId = formResult.data.targetSheetId
      ?? ((formResult.data.schema as any)?.settings?.targetSheetId as string | undefined);
    if (targetSheetId && targetSheetId !== 'none') {
      try {
        const attachmentMode: 'embed_cells' | 'attach_row' | 'both' =
          ((formResult.data.schema as any)?.settings?.attachmentMode as 'embed_cells' | 'attach_row' | 'both') ?? 'embed_cells';

        const columnsResult = await SheetColumnEntity.query.primary({ sheetId: targetSheetId }).go();
        const fieldNameToId: Record<string, string> = {};
        const fieldLabelToId: Record<string, string> = {};
        for (const col of columnsResult.data) {
          const fieldName = (col.config as Record<string, unknown>)?.fieldName as string | undefined;
          fieldNameToId[fieldName ?? col.name] = col.columnId;
          fieldLabelToId[col.name] = col.columnId;
        }

        const mappedData: Record<string, unknown> = {};
        const rowFiles: AttachedFileRecord[] = [];

        for (const [key, value] of Object.entries(submissionData as Record<string, unknown>)) {
          const { cellValue, attachedFiles } = encodeFormValueForSheet(
            value,
            attachmentMode,
            (req as any).user?.id ?? 'form',
          );
          const mappedKey = fieldNameToId[key] ?? fieldLabelToId[key] ?? key;
          if (attachmentMode !== 'attach_row') {
            mappedData[mappedKey] = cellValue;
          } else {
            // attach_row: still write non-image values as plain text
            if (!Array.isArray(value)) mappedData[mappedKey] = value;
          }
          rowFiles.push(...attachedFiles);
        }

        if (rowFiles.length > 0) {
          mappedData._files_ = rowFiles;
        }

        await SheetRowEntity.create({
          rowId: nanoid(),
          sheetId: targetSheetId,
          projectId,
          data: mappedData,
          createdBy: (req as any).user?.id,
        }).go();
      } catch (sheetErr) {
        console.error('[Submit] Failed to write sheet row:', sheetErr);
      }
    }

    res.status(201).json({
      success: true,
      submission_id: submissionId,
      data: { submission: result.data },
      message: 'Submission received',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Submission failed' });
  }
});

// Alias: Create Submission (Simpler URL)
router.post('/:formId/submissions', async (req: Request, res: Response) => {
  const formId = req.params.formId;
  const projectId = req.body.projectId || req.query.projectId;
  const data = req.body;

  if (!projectId) {
    return res.status(400).json({ success: false, error: 'projectId is required' });
  }

  try {
    const formResult = await FormEntity.get({ projectId: String(projectId), formId }).go();
    if (!formResult.data) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }

    const submissionData = data.response_data ?? data;
    const submissionId = nanoid();
    const result = await SubmissionEntity.create({
      submissionId,
      formId,
      projectId: String(projectId),
      data: submissionData,
      status: 'PENDING',
    }).go();

    // Write to linked sheet if form has targetSheetId
    const targetSheetId = formResult.data.targetSheetId
      ?? ((formResult.data.schema as any)?.settings?.targetSheetId as string | undefined);
    if (targetSheetId && targetSheetId !== 'none') {
      try {
        const attachmentMode: 'embed_cells' | 'attach_row' | 'both' =
          ((formResult.data.schema as any)?.settings?.attachmentMode as 'embed_cells' | 'attach_row' | 'both') ?? 'embed_cells';

        const columnsResult = await SheetColumnEntity.query.primary({ sheetId: targetSheetId }).go();
        const fieldNameToId: Record<string, string> = {};
        const fieldLabelToId: Record<string, string> = {};
        for (const col of columnsResult.data) {
          const fieldName = (col.config as Record<string, unknown>)?.fieldName as string | undefined;
          fieldNameToId[fieldName ?? col.name] = col.columnId;
          fieldLabelToId[col.name] = col.columnId;
        }

        const mappedData: Record<string, unknown> = {};
        const rowFiles: AttachedFileRecord[] = [];

        for (const [key, value] of Object.entries(submissionData as Record<string, unknown>)) {
          const { cellValue, attachedFiles } = encodeFormValueForSheet(
            value,
            attachmentMode,
            (req as any).user?.id ?? 'form',
          );
          const mappedKey = fieldNameToId[key] ?? fieldLabelToId[key] ?? key;
          if (attachmentMode !== 'attach_row') {
            mappedData[mappedKey] = cellValue;
          } else {
            if (!Array.isArray(value)) mappedData[mappedKey] = value;
          }
          rowFiles.push(...attachedFiles);
        }

        if (rowFiles.length > 0) {
          mappedData._files_ = rowFiles;
        }

        await SheetRowEntity.create({
          rowId: nanoid(),
          sheetId: targetSheetId,
          projectId: String(projectId),
          data: mappedData,
          createdBy: (req as any).user?.id,
        }).go();
      } catch (sheetErr) {
        console.error('[Submit] Failed to write sheet row:', sheetErr);
      }
    }

    res.status(201).json({ success: true, data: { submission: result.data } });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Error' });
  }
});

// Form Analytics
router.get(['/forms/:formId/analytics', '/:formId/analytics'], async (req: Request, res: Response) => {
  const formId = req.params.formId;
  const projectId = req.query.projectId as string | undefined;
  const userId = (req as AuthenticatedRequest).user.id;
  const isAdmin = (req as AuthenticatedRequest).user?.systemRole === 'ADMIN';

  if (projectId) {
    const memberResult = await ProjectMemberEntity.get({ projectId, userId }).go();
    if (!memberResult.data && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }

  try {
    const result = await SubmissionEntity.query.byForm({ formId }).go();
    const submissions = result.data;
    const total = submissions.length;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubmissions = submissions.filter((s) => new Date(s.createdAt ?? 0) >= thirtyDaysAgo);

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
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// Get Submissions
router.get(['/forms/:formId/submissions', '/:formId/submissions'], async (req: Request, res: Response) => {
  const formId = req.params.formId;
  const projectId = req.query.projectId as string | undefined;
  const userId = (req as AuthenticatedRequest).user.id;
  const isAdmin = (req as AuthenticatedRequest).user?.systemRole === 'ADMIN';

  if (!projectId) {
    return res.status(400).json({ success: false, error: 'projectId query parameter required' });
  }

  const memberResult = await ProjectMemberEntity.get({ projectId, userId }).go();
  if (!memberResult.data && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  try {
    const result = await SubmissionEntity.query.byForm({ formId }).go();
    const submissions = result.data;
    res.json({ success: true, data: { submissions }, meta: { total: submissions.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// Download Submission Zip
router.get('/submissions/:id/zip', authenticate, async (req: Request, res: Response) => {
  try {
    const submissionId = req.params.id;
    const userId = (req as AuthenticatedRequest).user.id;
    const isAdmin = (req as AuthenticatedRequest).user?.systemRole === 'ADMIN';

    // Find submission by scanning (we don't know projectId)
    const scanResult = await SubmissionEntity.scan
      .where((attr, op) => op.eq(attr.submissionId, submissionId))
      .go();
    const submission = scanResult.data[0];

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify project membership before serving files
    if (!isAdmin) {
      const memberResult = await ProjectMemberEntity.get({ projectId: submission.projectId, userId }).go();
      if (!memberResult.data) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Find files linked to this submission
    const filesResult = await FileUploadEntity.query
      .bySubmission({ submissionId })
      .go();
    const files = filesResult.data;

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found for this submission' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment(`submission-${submissionId}-files.zip`);
    archive.pipe(res);

    for (const file of files) {
      try {
        const bucketName = process.env.S3_BUCKET || 'worktree-local';
        const command = new GetObjectCommand({ Bucket: bucketName, Key: file.objectKey });
        const s3Response = await s3Client.send(command);
        if (s3Response.Body) {
          archive.append(Readable.fromWeb(s3Response.Body as import('stream/web').ReadableStream), { name: file.originalName ?? file.objectKey });
        }
      } catch (fileErr) {
        archive.append(`Failed to download: ${file.originalName}`, {
          name: `ERROR_${file.originalName}.txt`,
        });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('ZIP Error:', error);
    res.status(500).json({ error: 'Failed to generate ZIP' });
  }
});

// Bulk Import
import { BulkImportService } from '../services/import.service.js';
import { SheetIntegrationService } from '../services/sheet-integration.service.js';

const bulkImportService = new BulkImportService();
const sheetIntegrationService = new SheetIntegrationService();

router.post('/:id/import', authenticate, async (req: Request, res: Response) => {
  try {
    const { data, projectId } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of rows.' });
    }
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    const userId = (req as AuthenticatedRequest).user.id;
    const isAdmin = (req as AuthenticatedRequest).user?.systemRole === 'ADMIN';
    if (!isAdmin) {
      const memberResult = await ProjectMemberEntity.get({ projectId, userId }).go();
      if (!memberResult.data) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const result = await bulkImportService.importSubmissions(req.params.id, projectId, data);
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Import Error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Export PDF
router.get('/forms/:formId/submissions/:submissionId/export-pdf', async (req: Request, res: Response) => {
  try {
    const { formId, submissionId } = req.params;
    const projectId = req.query.projectId as string;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId query parameter required' });
    }

    const userId = (req as AuthenticatedRequest).user.id;
    const isAdmin = (req as AuthenticatedRequest).user?.systemRole === 'ADMIN';
    if (!isAdmin) {
      const memberResult = await ProjectMemberEntity.get({ projectId, userId }).go();
      if (!memberResult.data) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const formResult = await FormEntity.get({ projectId, formId }).go();
    const form = formResult.data;
    if (!form) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }

    const overlay = (form.schema as Record<string, unknown>)?.overlay as
      | { pdfUrl: string; fields: Array<{ fieldId: string; x: number; y: number; page: number }> }
      | undefined;
    if (!overlay) {
      return res.status(404).json({ success: false, error: 'No PDF overlay configured for this form' });
    }

    const subResult = await SubmissionEntity.get({ projectId, submissionId }).go();
    if (!subResult.data) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const pdfBuffer = await generateFlattenedPDF(overlay, subResult.data.data as Record<string, unknown>);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="submission-${submissionId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Export Error:', error);
    res.status(500).json({ success: false, error: 'Failed to export PDF' });
  }
});

export default router;

