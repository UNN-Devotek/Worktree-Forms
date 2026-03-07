import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';
import multer from 'multer';
import sharp from 'sharp';
import { UploadService } from '../services/upload.service.js';
import { ProjectEntity, ProjectMemberEntity, docClient, TABLE_NAME } from '../lib/dynamo/index.js';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.dll', '.so', '.bin'];
const BLOCKED_MIMETYPES = ['application/x-executable', 'application/x-msdownload', 'application/x-sh'];

/** Compress images to max 1920x1080 and auto-name them */
async function processImage(
  buffer: Buffer,
  mimetype: string,
  fieldName: string,
  projectName: string,
): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
  if (!mimetype.startsWith('image/')) {
    const ext = mimetype.split('/')[1] || 'bin';
    return { buffer, filename: `${fieldName}.${ext}`, mimetype };
  }
  const compressed = await sharp(buffer)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const date = new Date().toISOString().slice(0, 10);
  const safeName = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${safeName(fieldName)}_${safeName(projectName)}_${date}.jpg`;
  return { buffer: compressed, filename, mimetype: 'image/jpeg' };
}

// ==========================================
// GENERIC UPLOAD ENDPOINT
// ==========================================

router.post('/', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const ext = '.' + (req.file.originalname.split('.').pop() || '').toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext) || BLOCKED_MIMETYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: 'File type not allowed' });
    }

    const projectId = req.body.projectId as string | undefined;
    const formId = req.body.formId as string | undefined;
    const submissionId = req.body.submissionId as string | undefined;
    const fieldName = req.body.fieldName || req.file.fieldname || 'upload';
    const userId = (req as AuthenticatedRequest).user.id;

    // Verify project membership when a projectId is provided
    if (projectId) {
      const membership = await ProjectMemberEntity.query.primary({ projectId, userId }).go();
      if (!membership.data.length) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }

    let projectName = projectId || 'unknown';
    if (projectId) {
      // Single fetch — reused for both quota check and storage increment
      const projectResult = await ProjectEntity.get({ projectId }).go();
      if (projectResult.data) {
        projectName = projectResult.data.name;
        const quota = projectResult.data.storageQuotaBytes ?? 10737418240;
        const used = projectResult.data.storageUsedBytes ?? 0;
        if (used + req.file.size > quota * 1.1) {
          return res.status(413).json({ success: false, error: 'Storage quota exceeded' });
        }
      }
    }

    const { buffer, filename, mimetype } = await processImage(
      req.file.buffer,
      req.file.mimetype,
      fieldName,
      projectName,
    );

    const keyParts = [projectId || 'uploads', formId || 'general', submissionId || 'pending', filename];
    const objectKey = keyParts.join('/');

    const result = await UploadService.uploadFileRaw(
      { buffer, filename, mimetype, size: buffer.length, objectKey },
      userId,
      projectId || 'global',
    );
    const url = UploadService.getFileUrl(result.objectKey);

    // Atomically increment project storage usage via DynamoDB ADD (avoids read-modify-write race)
    if (projectId) {
      await docClient.send(new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { PK: { S: `PROJECT#${projectId}` }, SK: { S: 'PROJECT' } },
        UpdateExpression: 'ADD storageUsedBytes :n SET updatedAt = :ts',
        ExpressionAttributeValues: {
          ':n': { N: String(buffer.length) },
          ':ts': { S: new Date().toISOString() },
        },
      }));
    }

    res.json({ success: true, data: { ...result, url } });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

export default router;
