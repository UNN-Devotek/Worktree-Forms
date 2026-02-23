import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { UploadService } from '../services/upload.service.js';
import { prisma } from '../db.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

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

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
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
    const userId = (req as any).user.id;

    // Resolve project name for auto-naming + enforce storage quota
    let projectName = projectId || 'unknown';
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, storageUsage: true, storageLimit: true },
      });
      if (project) {
        projectName = project.name;
        const gracePeriod = 1.1; // 10% grace period
        if (project.storageUsage > BigInt(Math.floor(Number(project.storageLimit) * gracePeriod))) {
          return res.status(413).json({ success: false, error: 'Storage quota exceeded' });
        }
      }
    }

    // Process image (compress + auto-name)
    const { buffer, filename, mimetype } = await processImage(
      req.file.buffer,
      req.file.mimetype,
      fieldName,
      projectName,
    );

    // Build object key hierarchy: projectId/formId/submissionId/filename
    const keyParts = [projectId || 'uploads', formId || 'general', submissionId || 'pending', filename];
    const objectKey = keyParts.join('/');

    const result = await UploadService.uploadFileRaw(
      { buffer, filename, mimetype, size: buffer.length, objectKey },
      userId,
    );
    const url = UploadService.getFileUrl(result.objectKey);

    // Increment project storage usage
    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: { storageUsage: { increment: BigInt(buffer.length) } },
      });
    }

    res.json({ success: true, data: { ...result, url } });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

export default router;
