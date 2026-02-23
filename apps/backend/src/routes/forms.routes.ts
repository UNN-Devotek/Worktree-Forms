import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';
import { MigrationService } from '../services/migration-service.js';
import { rateLimitTiers } from '../middleware/rateLimiter.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';
import { StorageService } from '../storage.js';
import archiver from 'archiver';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../storage.js';

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
});

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// ==========================================
// FORM ENDPOINTS
// ==========================================

// Get all forms
router.get('/forms', async (req: Request, res: Response) => {
  try {
    const take = Math.min(parseInt(req.query.take as string) || 50, 200);
    const skip = parseInt(req.query.skip as string) || 0;
    const [forms, total] = await prisma.$transaction([
      prisma.form.findMany({ take, skip }),
      prisma.form.count()
    ]);
    res.json({
        success: true,
        data: forms,
        meta: { total, take, skip }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch forms' });
  }
});

// Get all forms for a group
router.get('/groups/:groupId/forms', async (req: Request, res: Response) => {
  const groupId = parseInt(req.params.groupId);
  if (isNaN(groupId)) {
    return res.status(400).json({ success: false, error: 'Invalid group ID' });
  }
  try {
      const take = Math.min(parseInt(req.query.take as string) || 50, 200);
      const skip = parseInt(req.query.skip as string) || 0;
      const [forms, total] = await prisma.$transaction([
        prisma.form.findMany({ where: { group_id: groupId }, take, skip }),
        prisma.form.count({ where: { group_id: groupId } })
      ]);
      res.json({
        success: true,
        data: { forms },
        meta: { total, take, skip }
      });
  } catch (error) {
       res.status(500).json({ success: false, error: 'Failed to fetch forms' });
  }
});

// Get specific form
router.get('/groups/:groupId/forms/:formId', async (req: Request, res: Response) => {
  const groupId = parseInt(req.params.groupId);
  const formId = parseInt(req.params.formId);
  if (isNaN(groupId) || isNaN(formId)) {
    return res.status(400).json({ success: false, error: 'Invalid group ID or form ID' });
  }

  try {
      const form = await prisma.form.findFirst({
          where: { id: formId, group_id: groupId }
      });
      
      if (!form) {
        return res.status(404).json({ success: false, error: 'Form not found' });
      }

      // Ownership check: if the form belongs to a project, verify the caller has access
      if (form.projectId) {
          const userId = (req as any).user.id;
          const project = await prisma.project.findFirst({
              where: {
                  id: form.projectId,
                  OR: [
                      { createdById: userId },
                      { members: { some: { userId } } }
                  ]
              },
              select: { id: true }
          });
          if (!project) {
              return res.status(403).json({ success: false, error: 'Access denied' });
          }
      }

      // [VERSIONING] Get latest version ID for frontend to bind to
      const latestVersion = await prisma.formVersion.findFirst({
         where: { form_id: formId },
         orderBy: { version: 'desc' },
         select: { id: true, version: true }
      });

      res.json({ 
          success: true, 
          data: { 
              form,
              latestVersionId: latestVersion?.id,
              version: latestVersion?.version
          } 
      });
  } catch (error) {
      res.status(500).json({ success: false, error: 'Error fetching form' });
  }
});

// Create new form
router.post('/groups/:groupId/forms', auditMiddleware('form.create'), async (req: Request, res: Response) => {
  const groupId = parseInt(req.params.groupId);
  if (isNaN(groupId)) {
    return res.status(400).json({ success: false, error: 'Invalid group ID' });
  }

  const parsed = createFormSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { title, description, form_type, form_json, is_published, is_active, folderId, groupSlug } = parsed.data;

  // Generate slug with base36 timestamp + random suffix to avoid collisions
  const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const slug = `${slugBase}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  try {
      let projectId: string | null = null;
      if (groupSlug) {
          const project = await prisma.project.findUnique({ where: { slug: groupSlug } });
          if (project) {
              projectId = project.id;
          }
      }

      const { newForm } = await prisma.$transaction(async (tx) => {
          const createdForm = await tx.form.create({
              data: {
                  group_id: groupId,
                  slug,
                  title,
                  description,
                  form_type,
                  form_schema: form_json || {},
                  is_published: is_published || false,
                  is_active: is_active ?? true,
                  folderId: folderId ? parseInt(folderId) : null,
                  projectId: projectId
              }
          });

          await tx.formVersion.create({
              data: {
                  form_id: createdForm.id,
                  version: 1,
                  schema: createdForm.form_schema || {},
                  changelog: 'Initial version',
                  editorId: req.body.userId || null
              }
          });

          return { newForm: createdForm };
      });

    res.status(201).json({
        success: true,
        data: { form: newForm },
        message: 'Form created successfully'
    });
  } catch (error: unknown) {
      console.error('Create Form Error:', error);
      if (error instanceof Object && 'code' in error && (error as { code: string }).code === 'P2002') {
          return res.status(409).json({ success: false, error: 'A form with this name already exists (slug collision)' });
      }
      res.status(500).json({
          success: false,
          error: 'Failed to create form',
          details: error instanceof Error ? error.message : 'Unknown error'
      });
  }
});

// Update form
router.put('/groups/:groupId/forms/:formId', async (req: Request, res: Response) => {
  const groupId = parseInt(req.params.groupId);
  const formId = parseInt(req.params.formId);
  const updates = req.body;

  try {
        // [VERSIONING] Check for schema changes
        if (updates.form_json) {
            const currentForm = await prisma.form.findUnique({ where: { id: formId } });
            
            // Simple string comparison for now (could be improved)
            if (currentForm && JSON.stringify(currentForm.form_schema) !== JSON.stringify(updates.form_json)) {
                console.log(`Schema change detected for Form ${formId}. Creating new version.`);
                
                // [MIGRATION] Check for Field Renames in this update
                const renames = MigrationService.detectRenames(currentForm.form_schema, updates.form_json);
                if (Object.keys(renames).length > 0) {
                     // Running async to not block
                     MigrationService.migrateSubmissions(formId, renames).catch(err => 
                        console.error('Migration failed:', err)
                     );
                }
                
                // Get max version
                const lastVersion = await prisma.formVersion.findFirst({
                    where: { form_id: formId },
                    orderBy: { version: 'desc' }
                });
                
                let nextVersion = 1;
                
                if (lastVersion) {
                    nextVersion = lastVersion.version + 1;
                } else {
                    // Backfill v1 if missing (legacy forms)
                    await prisma.formVersion.create({
                        data: {
                            form_id: formId,
                            version: 1,
                            schema: currentForm.form_schema || {},
                            changelog: 'Legacy version backfill'
                        }
                    });
                    nextVersion = 2; // We are identifying a CHANGE, so we move to 2
                }
                
                // Create new version
                await prisma.formVersion.create({
                    data: {
                        form_id: formId,
                        version: nextVersion,
                        schema: updates.form_json,
                        changelog: 'Updated via Form Builder',
                        editorId: updates.userId || null // [BLAME] Capture editor
                    }
                });
            }
        }

       // Only update fields that are present
       const dataToUpdate: any = {};
       if (updates.title) dataToUpdate.title = updates.title;
       if (updates.description) dataToUpdate.description = updates.description;
       if (updates.form_json) dataToUpdate.form_schema = updates.form_json;
       if (updates.is_published !== undefined) dataToUpdate.is_published = updates.is_published;
       if (updates.is_active !== undefined) dataToUpdate.is_active = updates.is_active;
       if (updates.folderId !== undefined) dataToUpdate.folderId = updates.folderId ? parseInt(updates.folderId) : null;
       if (updates.targetSheetId !== undefined) dataToUpdate.targetSheetId = updates.targetSheetId;

      const updatedForm = await prisma.form.update({
          where: { id: formId }, // Note: In real app, better ensure group_id matches too
          data: dataToUpdate
      });

      res.json({
        success: true,
        data: { form: updatedForm },
        message: 'Form updated successfully'
      });
  } catch (error: unknown) {
       console.error('Update Form Error:', error);
      res.status(500).json({ success: false, error: 'Failed to update form', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// [HISTORY] Get Form Versions
router.get('/groups/:groupId/forms/:formId/versions', async (req: Request, res: Response) => {
    const formId = parseInt(req.params.formId);
    try {
        const versions = await prisma.formVersion.findMany({
            where: { form_id: formId },
            orderBy: { version: 'desc' },
            include: {
                editor: {
                    select: { name: true, email: true }
                }
            }
        });
        res.json({ success: true, data: { versions } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch versions' });
    }
});

// [HISTORY] Restore Version
router.post('/groups/:groupId/forms/:formId/versions/:versionId/restore', async (req: Request, res: Response) => {
    const formId = parseInt(req.params.formId);
    const versionId = parseInt(req.params.versionId);
    const userId = req.body.userId; // Assuming user is passed

    try {
        // 1. Get the target version
        const targetVersion = await prisma.formVersion.findUnique({
            where: { id: versionId }
        });

        if (!targetVersion || targetVersion.form_id !== formId) {
            return res.status(404).json({ success: false, error: 'Version not found' });
        }

        // 2. Get next version number
        const lastVersion = await prisma.formVersion.findFirst({
            where: { form_id: formId },
            orderBy: { version: 'desc' },
            select: { version: true }
        });
        const nextVersion = (lastVersion?.version || 0) + 1;

        // 3. Create NEW version (Copy of target)
        const newVersion = await prisma.formVersion.create({
            data: {
                form_id: formId,
                version: nextVersion,
                schema: targetVersion.schema || {},
                changelog: `Restored from v${targetVersion.version}`,
                editorId: userId || null
            }
        });

        // 4. Update Main Form
        const updatedForm = await prisma.form.update({
            where: { id: formId },
            data: {
                form_schema: targetVersion.schema || {}
            }
        });

        res.json({ 
            success: true, 
            data: { 
                version: newVersion,
                form: updatedForm
            },
            message: `Restored to version ${targetVersion.version}`
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
        
        res.json({
            success: true,
            data: {
                uploadUrl,
                key,
                url: finalUrl 
            }
        });
    } catch (error) {
        console.error('Storage Error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate upload URL' });
    }
});

// Upload File (Direct)
router.post('/groups/:groupId/forms/:formId/upload', rateLimitTiers.upload, upload.single('file'), async (req: Request, res: Response) => {
  const formId = req.params.formId;

  if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const file = req.file;

  try {
      // 1. Fetch Form & Project to check Quota
      const form = await prisma.form.findUnique({
          where: { id: parseInt(formId) },
          include: { project: true }
      });

      if (form?.project) {
          const PLAN_LIMITS: Record<string, number> = {
              'FREE': 1 * 1024 * 1024 * 1024, // 1GB
              'PRO': 10 * 1024 * 1024 * 1024, // 10GB
              'ENTERPRISE': 100 * 1024 * 1024 * 1024 // 100GB
          };
          const limit = PLAN_LIMITS[form.project.plan] || PLAN_LIMITS['FREE'];
          const currentUsage = BigInt(form.project.storageUsage || 0);
          
          if (currentUsage + BigInt(file.size) > BigInt(limit)) {
              return res.status(403).json({ success: false, error: 'Storage quota exceeded. Please upgrade your plan.' });
          }
      }

      // Upload using UploadService
      const fileRecord = await UploadService.uploadFile(
        file,
        'form_uploads',
        (req as any).user?.id
      );

      // 2. Increment Usage Stats
      if (form?.project) {
          await prisma.project.update({
              where: { id: form.project.id },
              data: { storageUsage: { increment: file.size } }
          });
      }

      const displayUrl = UploadService.getFileUrl(fileRecord.objectKey);

      res.json({
        success: true,
        data: {
          files: [{
              id: fileRecord.id,
              filename: fileRecord.filename,
              object_key: fileRecord.objectKey,
              url: displayUrl,
              size: fileRecord.size,
              content_type: fileRecord.contentType
          }]
        }
      });
  } catch (error) {
      console.error('❌ Upload Error:', error instanceof Error ? error.message : error);
      res.status(500).json({ success: false, error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create Submission
router.post('/groups/:groupId/forms/:formId/submit', async (req: Request, res: Response) => {
  const formId = parseInt(req.params.formId);
  const data = req.body;

  try {
      // 1. Quota Check
      const form = await prisma.form.findUnique({
          where: { id: formId },
          include: { project: true }
      });

      if (form?.project) {
          const SUBMISSION_LIMITS: Record<string, number> = {
              'FREE': 100,
              'PRO': 10000,
              'ENTERPRISE': 1000000
          };
          const limit = SUBMISSION_LIMITS[form.project.plan] || SUBMISSION_LIMITS['FREE'];
          
          if ((form.project.submissionCount || 0) >= limit) {
              return res.status(403).json({ success: false, error: 'Submission quota exceeded. Please upgrade.' });
          }
      }

      // [VERSIONING] Link to provided version (preferred) or fallback to latest
      let versionId: number | undefined | null = data.form_version_id;

      if (!versionId) {
         console.warn(`Submission for Form ${formId} missing version ID. Falling back to LATEST.`);
         const latestVersion = await prisma.formVersion.findFirst({
             where: { form_id: formId },
             orderBy: { version: 'desc' },
             select: { id: true }
         });
         versionId = latestVersion?.id;
      }
      
      const submission = await prisma.submission.create({
          data: {
              form_id: formId,
              form_version_id: versionId,
              data: data.response_data || data, // Handle wrapper or direct data
              status: 'pending'
          }
      });
      
      // 2. Increment Usage
      if (form?.project) {
          await prisma.project.update({
              where: { id: form.project.id },
              data: { submissionCount: { increment: 1 } }
          });
      }

      // 3. Smart Sheet Integration
      if (form?.targetSheetId) {
          sheetIntegrationService.appendSubmissionToSheet(form.targetSheetId, submission.data).catch(err => {
              console.error('Sheet integration async failure:', err);
          });
      }

      res.status(201).json({
          success: true,
          submission_id: submission.id,
          data: { submission },
          message: 'Submission received'
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Submission failed' });
  }
});

// Alias: Create Submission (Simpler URL)
router.post('/:formId/submissions', async (req: Request, res: Response) => {
    const formId = parseInt(req.params.formId);
    const data = req.body;
    try {
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: { project: true }
        });

        if (form?.project) {
            const SUBMISSION_LIMITS: Record<string, number> = {
                'FREE': 100,
                'PRO': 10000,
                'ENTERPRISE': 1000000
            };
            const limit = SUBMISSION_LIMITS[form.project.plan] || SUBMISSION_LIMITS['FREE'];
            
            if ((form.project.submissionCount || 0) >= limit) {
                return res.status(403).json({ success: false, error: 'Submission quota exceeded' });
            }
        }

        let versionId: number | undefined | null = data.form_version_id;

        if (!versionId) {
             const latestVersion = await prisma.formVersion.findFirst({
                where: { form_id: formId },
                orderBy: { version: 'desc' },
                select: { id: true }
             });
             versionId = latestVersion?.id;
        }

        const submission = await prisma.submission.create({
            data: {
                form_id: formId,
                form_version_id: versionId,
                data: data.response_data || data,
                status: 'pending'
            }
        });

        if (form?.project) {
            await prisma.project.update({
                where: { id: form.project.id },
                data: { submissionCount: { increment: 1 } }
            });
        }

        res.status(201).json({ success: true, data: { submission } });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Error' });
    }
});

// Get Submissions
router.get('/:formId/submissions', async (req: Request, res: Response) => {
  const formId = parseInt(req.params.formId);
  if (isNaN(formId)) {
    return res.status(400).json({ success: false, error: 'Invalid form ID' });
  }
  const take = Math.min(parseInt(req.query.take as string) || 20, 100);
  const skip = parseInt(req.query.skip as string) || 0;

  const userId = (req as any).user.id;

  // Verify caller has access to the form's project
  const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { projectId: true }
  });
  if (!form) {
      return res.status(404).json({ success: false, error: 'Form not found' });
  }
  if (form.projectId) {
      const project = await prisma.project.findFirst({
          where: {
              id: form.projectId,
              OR: [
                  { createdById: userId },
                  { members: { some: { userId } } }
              ]
          },
          select: { id: true }
      });
      if (!project) {
          return res.status(403).json({ success: false, error: 'Access denied' });
      }
  }

  try {
      const [submissions, total] = await Promise.all([
          prisma.submission.findMany({
              where: { form_id: formId },
              orderBy: { createdAt: 'desc' },
              take,
              skip
          }),
          prisma.submission.count({ where: { form_id: formId } })
      ]);
      res.json({ success: true, data: { submissions }, meta: { total, take, skip } });
  } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

// Download Submission Zip
router.get('/submissions/:id/zip', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const submissionId = parseInt(id);

    if (isNaN(submissionId)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        files: true,
        form_version: {
            include: { form: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const files = submission.files;
    if (!files || files.length === 0) {
        return res.status(404).json({ error: 'No files found for this submission' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment(`submission-${submissionId}-files.zip`);
    archive.pipe(res);

    for (const file of files) {
        try {
            const bucketName = process.env.MINIO_BUCKET_NAME || 'worktree-files';
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: file.objectKey
            });
            const s3Response = await s3Client.send(command);
            
            if (s3Response.Body) {
                 // @ts-ignore
                archive.append(s3Response.Body as NodeJS.ReadableStream, { name: file.filename });
            }
        } catch (fileErr) {
            archive.append(`Failed to download: ${file.filename}`, { name: `ERROR_${file.filename}.txt` });
        }
    }

    await archive.finalize();

  } catch (error) {
    console.error('ZIP Error:', error);
    res.status(500).json({ error: 'Failed to generate ZIP' });
  }
});

// Bulk Import Handlers (from 8.3)
import { BulkImportService } from '../services/import.service.js';
import { SheetIntegrationService } from '../services/sheet-integration.service.js';

const bulkImportService = new BulkImportService();
const sheetIntegrationService = new SheetIntegrationService();

router.post('/:id/import', async (req: Request, res: Response) => {
    try {
        const { data } = req.body;
        if (!Array.isArray(data)) {
             return res.status(400).json({ error: 'Invalid data format. Expected array of rows.' });
        }
        const result = await bulkImportService.importSubmissions(Number(req.params.id), data);
        res.json({ success: true, count: result.count });
    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ error: 'Failed to import data' });
    }
});

export default router;
