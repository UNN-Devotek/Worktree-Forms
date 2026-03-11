import { Router, Request, Response } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';
import { FileUploadEntity } from '../lib/dynamo/index.js';
import { s3, S3_BUCKET, rewriteForBrowser } from '../storage.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
});

const BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.dll', '.so', '.bin'];
const BLOCKED_MIMETYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/x-sh',
];

// GET /api/files/presigned — generate a presigned PUT URL for direct S3 upload
router.get('/presigned', authenticate, requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
  const { key, contentType = 'application/octet-stream' } = req.query as Record<string, string>;
  if (!key) {
    return res.status(400).json({ success: false, error: 'key query parameter is required' });
  }

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    const rawUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes
    const url = rewriteForBrowser(rawUrl);
    res.json({ success: true, data: { url, key, contentType } });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate presigned URL' });
  }
});

// GET /api/files?projectId — list files for a project
router.get('/', authenticate, requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
  const { projectId } = req.query as Record<string, string>;
  if (!projectId) {
    return res.status(400).json({ success: false, error: 'projectId query parameter is required' });
  }

  try {
    const result = await FileUploadEntity.query.primary({ projectId }).go();
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ success: false, error: 'Failed to list files' });
  }
});

// POST /api/files/upload — multi-file upload for sheet row attachments
router.post('/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided' });
    }

    const userId = (req as AuthenticatedRequest).user.id;

    const urls: string[] = [];
    for (const file of files) {
      const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase();
      if (BLOCKED_EXTENSIONS.includes(ext) || BLOCKED_MIMETYPES.includes(file.mimetype)) {
        return res
          .status(400)
          .json({ success: false, error: `File type not allowed: ${file.originalname}` });
      }

      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const objectKey = `sheets/attachments/${Date.now()}_${safeName}`;

      const result = await UploadService.uploadFileRaw(
        {
          buffer: file.buffer,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          objectKey,
        },
        userId,
      );

      urls.push(UploadService.getFileUrl(result.objectKey));
    }

    res.json({ urls });
  } catch (error) {
    console.error('Multi-file upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload files' });
  }
});

export default router;
