import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service.js';

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

// POST /api/files/upload — multi-file upload for sheet row attachments
router.post('/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided' });
    }

    const userId = (req as any).user?.id || 'anonymous';

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
